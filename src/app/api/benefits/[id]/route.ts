import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { partnerName, partnerLogo, websiteUrl, title, description, discount, conditions, isActive, sortOrder } = body

    const benefit = await prisma.benefit.update({
      where: { id: params.id },
      data: {
        partnerName,
        partnerLogo,
        websiteUrl,
        title,
        description,
        discount,
        conditions,
        isActive,
        sortOrder
      }
    })

    return NextResponse.json(benefit)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const session = await auth()
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.benefit.delete({
      where: { id: params.id }
    })

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
