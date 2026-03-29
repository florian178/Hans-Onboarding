"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function signTaxForm(signatureBase64: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id!

  const existing = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "tax-data" } }
  })

  let d: any = {}
  if (existing?.data) {
    try {
      d = JSON.parse(existing.data)
    } catch {
      // ignore
    }
  }

  // Store the signature in the tax-data JSON
  d.signatureUrl = signatureBase64

  await prisma.stepProgress.upsert({
    where: { userId_stepId: { userId, stepId: "tax-data" } },
    create: {
      userId,
      stepId: "tax-data",
      completed: true,
      data: JSON.stringify(d)
    },
    update: {
      completed: true,
      data: JSON.stringify(d)
    }
  })

  return { success: true, url: signatureBase64 }
}
