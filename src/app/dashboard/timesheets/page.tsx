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
  if (Array.isArray(obj)) return obj.map(safeSerializeDates);
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = safeSerializeDates(obj[key]);
    }
    return newObj;
  }
  return obj;
}
