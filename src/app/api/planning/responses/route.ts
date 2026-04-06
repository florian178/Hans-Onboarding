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
    const requestId = searchParams.get("requestId")

    if (requestId) {
      // Get responses for a specific request
      const responses = await prisma.availabilityResponse.findMany({
        where: {
          employeeId: session.user.id,
          day: { requestId }
        }
      })
      return NextResponse.json(responses)
    }

    return new NextResponse("Bad Request", { status: 400 })

  } catch (error) {
    console.error("GET /api/planning/responses", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    // responses should be an array of { dayId: string, status: "YES"|"NO"|"MAYBE", comment: string? }
    const { responses } = body 

    if (!Array.isArray(responses)) {
        return new NextResponse("Invalid payload", { status: 400 })
    }

    const results = []
    // Process sequentially to handle UPSERT since Prisma SQLite supports upsert but just to be safe with loops
    for (const r of responses) {
      const res = await prisma.availabilityResponse.upsert({
        where: {
          employeeId_dayId: {
            employeeId: session.user.id!,
            dayId: r.dayId
          }
        },
        update: {
          status: r.status,
          comment: r.comment || null
        },
        create: {
          employeeId: session.user.id!,
          dayId: r.dayId,
          status: r.status,
          comment: r.comment || null
        }
      })
      results.push(res)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("POST /api/planning/responses", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
