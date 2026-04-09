import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET all templates
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const templates = await prisma.shiftTemplate.findMany({
    include: { rows: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(templates)
}

// POST create new template
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, rows } = await req.json()

  if (!name || !rows || rows.length === 0) {
    return NextResponse.json({ error: "Name und Zeilen erforderlich" }, { status: 400 })
  }

  const template = await prisma.shiftTemplate.create({
    data: {
      name,
      rows: {
        create: rows.map((r: any, i: number) => ({
          sortOrder: i,
          assignmentLabel: r.assignmentLabel,
          defaultStartTime: r.defaultStartTime || null,
        })),
      },
    },
    include: { rows: { orderBy: { sortOrder: "asc" } } },
  })

  return NextResponse.json(template)
}
