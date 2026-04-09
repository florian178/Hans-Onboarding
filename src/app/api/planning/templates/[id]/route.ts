import { NextResponse, NextRequest } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// DELETE a template
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await prisma.shiftTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
