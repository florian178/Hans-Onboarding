import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const userId = session.user.id!
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      onboardingStatus: true,
      documents: {
        where: {
          type: { in: ['CONTRACT_SIGNED', 'INSTRUCTION', 'HYGIENE_CERTIFICATE'] }
        },
        orderBy: { uploadedAt: 'desc' }
      },
      payslips: {
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      }
    }
  })

  // Security check: if onboarding not completed, redirect back
  if (user?.onboardingStatus?.status !== "COMPLETED") {
    redirect("/onboarding")
  }

  const globalInstructions = await prisma.document.findMany({
    where: { type: 'INSTRUCTION', userId: null },
    orderBy: { uploadedAt: 'desc' }
  })

  const taxDataProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "tax-data" } }
  })

  // Combine signed documents, templates and tax questionnaire
  const allDocuments = [...(user?.documents || []), ...globalInstructions]
  
  if (taxDataProgress?.completed) {
    allDocuments.push({
      id: "tax-questionnaire-virtual",
      name: "Personalfragebogen (Steuer)",
      url: "/dashboard/tax-form",
      type: "TAX_QUESTIONNAIRE",
      uploadedAt: taxDataProgress.updatedAt,
      userId: userId
    })
  }

  const personalDataProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })

  let firstName = ""
  if (personalDataProgress?.data) {
    try {
      const parsed = JSON.parse(personalDataProgress.data)
      firstName = parsed.firstName || ""
    } catch {
      // ignore JSON parse error
    }
  }

  const displayName = firstName || user?.name?.split(" ")[0] || "Mitarbeiter/-in"

  // Home highlights data
  const now = new Date()
  const monthStartStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  const [currentMonthTimesheets, nextShift, openRequests] = await Promise.all([
    prisma.timesheet.findMany({
      where: {
        userId,
        date: { gte: monthStartStr },
        status: 'APPROVED'
      },
      select: { totalHours: true, hourlyWage: true }
    }),
    prisma.staffPlanRow.findFirst({
      where: {
        employeeId: userId,
        plan: { status: 'FINAL', date: { gte: now } }
      },
      include: { plan: true },
      orderBy: { plan: { date: 'asc' } }
    }),
    prisma.availabilityRequest.findMany({
      where: {
        status: 'PUBLISHED',
        endDate: { gte: now },
        // Simple heuristic: if any day in the request has no response from this user
        days: {
          some: {
            responses: {
              none: { employeeId: userId }
            }
          }
        }
      },
      take: 2,
      orderBy: { updatedAt: 'desc' }
    })
  ])

  const currentMonthEarnings = currentMonthTimesheets.reduce((acc, t) => acc + (t.totalHours * (t.hourlyWage || 13.90)), 0)

  return (
    <DashboardClient 
      user={safeSerializeDates({
        name: displayName,
        email: user?.email || null,
        startDate: user?.startDate || null
      })}
      documents={safeSerializeDates(allDocuments)}
      payslips={safeSerializeDates(user?.payslips || [])}
      summary={{
        currentMonthEarnings,
        nextShift: safeSerializeDates(nextShift),
        openRequests: safeSerializeDates(openRequests)
      }}
    />
  )
}

function safeSerializeDates(obj: any): any {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}
