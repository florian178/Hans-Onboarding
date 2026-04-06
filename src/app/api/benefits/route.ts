import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const isAdmin = (session.user as any).role === "ADMIN"

    // Employees only see active benefits, admins see all (unless filtered)
    const whereClause: any = {}
    if (!isAdmin) {
      whereClause.isActive = true
    }

    const benefits = await prisma.benefit.findMany({
      where: whereClause,
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(benefits)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { partnerName, partnerLogo, title, description, discount, conditions, isActive, sortOrder } = body

    const benefit = await prisma.benefit.create({
      data: {
        partnerName,
        partnerLogo,
        title,
        description,
        discount,
        conditions,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(benefit)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
