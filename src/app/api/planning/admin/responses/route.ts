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
    const requestId = searchParams.get("requestId")

    if (!requestId) {
        return new NextResponse("Missing requestId", { status: 400 })
    }

    const responses = await prisma.availabilityResponse.findMany({
      where: {
        day: { requestId }
      },
      include: {
        user: {
            select: { id: true, name: true }
        },
        day: true
      }
    })

    return NextResponse.json(responses)

  } catch (error) {
    console.error("GET /api/planning/admin/responses", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
