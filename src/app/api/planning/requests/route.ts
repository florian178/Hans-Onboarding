import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const isAdmin = (session.user as any).role === "ADMIN"
    const whereClause = isAdmin ? {} : { status: "PUBLISHED" }

    const requests = await prisma.availabilityRequest.findMany({
      where: whereClause,
      orderBy: { startDate: 'desc' },
      include: {
        days: {
          orderBy: { date: 'asc' }
        }
      }
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error("GET /api/planning/requests", error)
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
    const { title, startDate, endDate, days } = body

    // Create the request along with the days
    const request = await prisma.availabilityRequest.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: "DRAFT",
        days: {
          create: days.map((d: any) => ({
            date: new Date(d.date),
            eventName: d.eventName || null,
            note: d.note || null
          }))
        }
      },
      include: { days: true }
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error("POST /api/planning/requests", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
