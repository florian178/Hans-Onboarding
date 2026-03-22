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

  return (
    <DashboardClient 
      user={{
        name: user.name,
        email: user.email,
        startDate: user.startDate
      }}
      documents={user.documents || []}
      payslips={user.payslips || []}
    />
  )
}
