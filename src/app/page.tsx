import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  if ((session.user as any)?.role === "ADMIN") {
    redirect("/admin")
  }

  const userId = session.user?.id
  if (!userId) redirect("/login")

  // If employee: check onboarding status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { onboardingStatus: true }
  })

  if (user?.onboardingStatus?.status === "COMPLETED") {
    redirect("/dashboard")
  } else {
    redirect("/onboarding")
  }
}
