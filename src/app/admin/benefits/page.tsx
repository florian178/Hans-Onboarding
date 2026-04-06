import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import BenefitsAdminClient from "./BenefitsAdminClient"

export default async function AdminBenefitsPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login")
  }

  const benefits = await prisma.benefit.findMany({
    orderBy: { sortOrder: 'asc' }
  })

  // Ensure plain JSON safe objects
  const safeBenefits = JSON.parse(JSON.stringify(benefits))

  return <BenefitsAdminClient initialBenefits={safeBenefits} />
}
