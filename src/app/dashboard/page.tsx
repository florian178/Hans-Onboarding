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
          type: { in: ['CONTRACT_SIGNED', 'INSTRUCTION'] }
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

  return (
    <DashboardClient 
      user={{
        name: displayName,
        email: user?.email || null,
        startDate: user?.startDate || null
      }}
      documents={user?.documents || []}
      payslips={user?.payslips || []}
    />
  )
}
