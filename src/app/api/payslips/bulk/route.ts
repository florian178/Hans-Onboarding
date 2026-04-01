import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument } from "pdf-lib"
import { PDFParse } from "pdf-parse"
import { put } from "@vercel/blob"

interface AssignedResult {
  employeeName: string
  employeeId: string
  page: number
}

interface UnassignedResult {
  page: number
  textSnippet: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const month = parseInt(formData.get("month") as string)
    const year = parseInt(formData.get("year") as string)

    if (!file || !month || !year) {
      return NextResponse.json({ error: "Fehlende Daten" }, { status: 400 })
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pageCount = pdfDoc.getPageCount()

    // Extract text from all pages using pdf-parse
    const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) })
    const textResult = await parser.getText()
    await parser.destroy()

    // Get all employees from DB
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isArchived: false },
      select: { id: true, name: true, email: true },
    })

    const assigned: AssignedResult[] = []
    const unassigned: UnassignedResult[] = []

    for (let i = 0; i < pageCount; i++) {
      // Get text for this page (pages in textResult are 1-indexed by num)
      const pageData = textResult.pages.find(p => p.num === i + 1)
      const pageText = pageData?.text || ""

      // Create single-page PDF
      const singlePageDoc = await PDFDocument.create()
      const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [i])
      singlePageDoc.addPage(copiedPage)
      const singlePageBytes = await singlePageDoc.save()
      const singlePageBuffer = Buffer.from(singlePageBytes)

      // Try to match employee name in text
      let matchedEmployee: { id: string; name: string | null; email: string | null } | null = null

      for (const emp of employees) {
        if (!emp.name) continue
        // Split the name into parts and check if all parts exist in the text
        const nameParts = emp.name.trim().split(/\s+/)
        const allPartsFound = nameParts.every((part) =>
          pageText.toLowerCase().includes(part.toLowerCase())
        )
        if (allPartsFound) {
          matchedEmployee = emp
          break
        }
      }

      if (matchedEmployee) {
        // Upload single-page PDF to Vercel Blob
        const filename = `payslips/${matchedEmployee.id}_${year}_${month}_page${i + 1}.pdf`
        const blob = await put(filename, singlePageBuffer, { access: "public" })

        // Upsert payslip record
        await prisma.payslip.upsert({
          where: {
            userId_month_year: {
              userId: matchedEmployee.id,
              month,
              year,
            },
          },
          update: {
            url: blob.url,
            uploadedAt: new Date(),
          },
          create: {
            userId: matchedEmployee.id,
            month,
            year,
            url: blob.url,
          },
        })

        assigned.push({
          employeeName: matchedEmployee.name || matchedEmployee.email || "Unbekannt",
          employeeId: matchedEmployee.id,
          page: i + 1,
        })
      } else {
        // Truncate text for display
        const snippet = pageText.substring(0, 200).replace(/\s+/g, " ").trim()
        unassigned.push({
          page: i + 1,
          textSnippet: snippet || "(Kein Text erkannt)",
        })
      }
    }

    return NextResponse.json({ assigned, unassigned, totalPages: pageCount })
  } catch (error) {
    console.error("Bulk payslip error:", error)
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der PDF" },
      { status: 500 }
    )
  }
}
