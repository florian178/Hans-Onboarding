import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, title, startDate, endDate, days } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (title) updateData.title = title
    if (startDate) updateData.startDate = new Date(startDate)
    if (endDate) updateData.endDate = new Date(endDate)

    const request = await prisma.availabilityRequest.update({
      where: { id },
      data: updateData
    })

    // If days array is provided, recreate them
    if (days && Array.isArray(days)) {
      // Delete old days (cascade will delete responses too)
      await prisma.availabilityDay.deleteMany({
        where: { requestId: id }
      })

      // Create new days
      await prisma.availabilityDay.createMany({
        data: days.map((d: any) => ({
          requestId: id,
          date: new Date(d.date),
          eventName: d.eventName || null,
          note: d.note || null
        }))
      })
    }

    return NextResponse.json(request)
  } catch (error) {
    console.error("PUT /api/planning/requests/[id]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params

    await prisma.availabilityRequest.delete({
      where: { id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("DELETE /api/planning/requests/[id]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
