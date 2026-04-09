import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Find all FINAL staff plan rows where the user is assigned
    const rows = await prisma.staffPlanRow.findMany({
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

    return NextResponse.json(rows)
  } catch (error) {
    console.error("GET /api/planning/my-shifts", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
