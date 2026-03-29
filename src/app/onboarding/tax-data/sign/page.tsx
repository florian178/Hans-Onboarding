import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { TaxSignForm } from "./TaxSignForm"

export default async function TaxSignPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const [user, steps] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.stepProgress.findMany({ where: { userId } })
  ])

  if (!user) redirect("/login")

  const personalDataStep = steps.find(s => s.stepId === 'personal-data' && s.completed)
  const taxDataProgress = steps.find(s => s.stepId === 'tax-data') // It might not be completed yet until signed

  if (!taxDataProgress) {
    redirect("/onboarding/tax-data")
  }

  let personalData = null
  if (personalDataStep?.data) {
    try {
      personalData = JSON.parse(personalDataStep.data)
    } catch {
      // ignore
    }
  }

  let taxData = null
  if (taxDataProgress.data) {
    try {
      taxData = JSON.parse(taxDataProgress.data)
    } catch {
      // ignore
    }
  }

  return (
    <TaxSignForm 
      user={user}
      personalData={personalData}
      taxData={taxData}
      taxDataProgress={taxDataProgress}
    />
  )
}
