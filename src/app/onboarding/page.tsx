import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function OnboardingIndex() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const steps = [
    "personal-data",
    "contract",
    "instructions",
    "video"
  ]

  const progresses = await prisma.stepProgress.findMany({
    where: { userId }
  })

  // Find the first uncompleted step
  for (const step of steps) {
    const p = progresses.find((pr) => pr.stepId === step)
    if (!p || !p.completed) {
      redirect(`/onboarding/${step}`)
    }
  }

  // All steps completed - but ensure the status record also says so to avoid loops
  const status = await prisma.onboardingStatus.findUnique({ where: { userId } })
  if (status?.status !== "COMPLETED") {
    await prisma.onboardingStatus.upsert({
      where: { userId },
      create: { userId, status: "COMPLETED" },
      update: { status: "COMPLETED" }
    })
  }

  redirect("/dashboard")
}
