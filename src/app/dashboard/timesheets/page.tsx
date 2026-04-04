import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TimesheetClient from "./TimesheetClient"

export default async function TimesheetsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const timesheets = await prisma.timesheet.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" }
  })

  // Convert dates to iso strings to pass safely to Client Component
  const serialized = timesheets.map(t => ({
    ...t,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt
  }))

  return <TimesheetClient initialTimesheets={serialized as any} />
}
