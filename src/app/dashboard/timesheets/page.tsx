import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TimesheetClient from "./TimesheetClient"

export default async function TimesheetsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const timesheets = await prisma.timesheet.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" }
  })

  return <TimesheetClient initialTimesheets={safeSerializeDates(timesheets)} />
}

function safeSerializeDates(obj: any): any {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}
