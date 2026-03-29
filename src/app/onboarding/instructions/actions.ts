"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function confirmInstructionsAction(signatureBase64: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.stepProgress.upsert({
    where: { userId_stepId: { userId: session.user.id!, stepId: "instructions" } },
    create: { 
      userId: session.user.id!, 
      stepId: "instructions", 
      completed: true,
      data: JSON.stringify({ signature: signatureBase64 })
    },
    update: { 
      completed: true,
      data: JSON.stringify({ signature: signatureBase64 })
    }
  })

  return { success: true }
}
