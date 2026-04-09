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

    const plan = await prisma.staffPlanDay.findUnique({
      where: { dayId },
      include: {
        rows: {
          include: {
            user: { select: { id: true, name: true } }
          },
          orderBy: { sortOrder: "asc" }
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
    const { dayId, date, eventName, note, status, rows } = body

    if (!dayId) return new NextResponse("Missing dayId", { status: 400 })

    const existingPlan = await prisma.staffPlanDay.findUnique({
      where: { dayId }
    })

    let plan: any
    if (existingPlan) {
      plan = await prisma.staffPlanDay.update({
        where: { id: existingPlan.id },
        data: { status, note, eventName },
      })

      // Delete old rows and recreate
      await prisma.staffPlanRow.deleteMany({
        where: { planId: plan.id }
      })

      if (rows && rows.length > 0) {
        await prisma.staffPlanRow.createMany({
          data: rows.map((r: any, i: number) => ({
            planId: plan.id,
            sortOrder: i,
            assignmentLabel: r.assignmentLabel,
            employeeId: r.employeeId || null,
            startTime: r.startTime || null,
            endTime: r.endTime || null,
            note: r.note || null,
          }))
        })
      }
    } else {
      plan = await prisma.staffPlanDay.create({
        data: {
          dayId,
          date: new Date(date),
          eventName,
          note,
          status,
          rows: {
            create: (rows || []).map((r: any, i: number) => ({
              sortOrder: i,
              assignmentLabel: r.assignmentLabel,
              employeeId: r.employeeId || null,
              startTime: r.startTime || null,
              endTime: r.endTime || null,
              note: r.note || null,
            }))
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
