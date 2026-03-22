"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function signContract(signatureBase64: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id!

  // In a Vercel serverless environment, the filesystem is read-only.
  // Instead of saving the signature as a file, we store the Base64 Data URL 
  // directly in the Postgres database (url field maps to TEXT).
  await prisma.document.create({
    data: {
      name: `Digital unterschriebener Arbeitsvertrag (${session.user.name || userId})`,
      url: signatureBase64,
      type: "CONTRACT_SIGNED",
      userId: userId
    }
  })

  // Mark step as completed
  await prisma.stepProgress.upsert({
    where: { userId_stepId: { userId, stepId: "contract" } },
    create: { userId: userId, stepId: "contract", completed: true },
    update: { completed: true }
  })

  return { success: true, url: signatureBase64 }
}
