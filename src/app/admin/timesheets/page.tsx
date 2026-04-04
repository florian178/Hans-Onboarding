import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import TimesheetAdminClient from "@/components/admin/timesheets/TimesheetAdminClient"

export default async function AdminTimesheetPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  const timesheets = await prisma.timesheet.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { date: "desc" }
  })

  // get distinct users for filter dropdown
  const rawUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    where: { isArchived: false }
  })

  // Serialize dates for Client Component
  const safeTimesheets = timesheets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: t.user ? {
      name: t.user.name,
      email: t.user.email
    } : null
  }))

  return <TimesheetAdminClient timesheets={safeTimesheets as any} users={rawUsers} />
}
