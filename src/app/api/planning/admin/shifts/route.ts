import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dayId = searchParams.get("dayId")

    if (!dayId) {
      return new NextResponse("Missing dayId", { status: 400 })
    }

    // Try to find an existing plan for this day
    const plan = await prisma.staffPlanDay.findUnique({
      where: { dayId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })

    return NextResponse.json(plan || null)
  } catch (error) {
    console.error("GET /api/planning/admin/shifts", error)
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
    const { dayId, date, eventName, note, status, assignments } = body

    if (!dayId) return new NextResponse("Missing dayId", { status: 400 })

    // Find existing plan to see if we need to update or create
    const existingPlan = await prisma.staffPlanDay.findUnique({
      where: { dayId }
    })

    let plan: any;
    if (existingPlan) {
      // Update plan and recreate assignments
      plan = await prisma.staffPlanDay.update({
        where: { id: existingPlan.id },
        data: { status, note, eventName },
      })
      
      // Delete old assignments
      await prisma.staffPlanAssignment.deleteMany({
        where: { planId: plan.id }
      })
      
      // Create new assignments
      if (assignments && assignments.length > 0) {
        await prisma.staffPlanAssignment.createMany({
          data: assignments.map((a: any) => ({
            planId: plan.id,
            employeeId: a.employeeId,
            area: a.area,
            role: a.role || "",
            startTime: a.startTime || "",
            note: a.note || ""
          }))
        })
      }
    } else {
      // Create new plan with assignments
      plan = await prisma.staffPlanDay.create({
        data: {
          dayId,
          date: new Date(date),
          eventName,
          note,
          status,
          assignments: {
            create: assignments?.map((a: any) => ({
              employeeId: a.employeeId,
              area: a.area,
              role: a.role || "",
              startTime: a.startTime || "",
              note: a.note || ""
            })) || []
          }
        }
      })
    }

    return NextResponse.json({ success: true, planId: plan.id })
  } catch (error) {
    console.error("POST /api/planning/admin/shifts", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
