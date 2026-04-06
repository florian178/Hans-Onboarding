import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Find all FINAL staff plans where the user is assigned
    const assignments = await prisma.staffPlanAssignment.findMany({
      where: {
        employeeId: session.user.id,
        plan: {
          status: "FINAL"
        }
      },
      include: {
        plan: true
      },
      orderBy: {
        plan: {
          date: 'asc'
        }
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("GET /api/planning/my-shifts", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
