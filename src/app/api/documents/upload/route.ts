import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const type = formData.get("type") as string

    if (!file || !name || !type) {
      return NextResponse.json({ error: "Fehlende Daten." }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`documents/${session.user.id}/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    // Save metadata to DB
    const doc = await prisma.document.create({
      data: {
        userId: session.user.id,
        name,
        type,
        url: blob.url,
      },
    })

    return NextResponse.json({ document: doc })
  } catch (error: any) {
    console.error("Document upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed." }, { status: 500 })
  }
}
