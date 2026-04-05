import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const status = searchParams.get("status")

  const isAdmin = (session.user as any).role === "ADMIN"

  // Only admins can request timesheets for other users
  if (userId && userId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const queryUserId = isAdmin ? (userId || undefined) : session.user.id

  try {
    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId: queryUserId,
        ...(status ? { status } : {}),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(timesheets)
  } catch (error) {
    console.error("GET Timesheets error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Zeiteinträge" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { date, startTime, endTime, breakMinutes, totalHours, note, status } = body

    if (!date || !startTime || !endTime || totalHours === undefined) {
      return NextResponse.json({ error: "Fehlende Pflichtfelder" }, { status: 400 })
    }

    // Get current user to save their hourly wage as a snapshot if they are submitting
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hourlyWage: true }
    })

    const timesheet = await prisma.timesheet.create({
      data: {
        userId: session.user.id,
        date,
        startTime,
        endTime,
        breakMinutes: Number(breakMinutes) || 0,
        totalHours: Number(totalHours),
        note,
        status: status || "DRAFT",
        hourlyWage: user?.hourlyWage || 13.90,
      },
    })

    return NextResponse.json(timesheet)
  } catch (error) {
    console.error("POST Timesheet error:", error)
    return NextResponse.json({ error: "Fehler beim Erstellen des Zeiteintrags" }, { status: 500 })
  }
}
