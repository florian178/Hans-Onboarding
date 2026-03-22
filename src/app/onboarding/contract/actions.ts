"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function signContract(signatureBase64: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const userId = session.user.id!

  // The base64 string comes as "data:image/png;base64,...""
  const base64Data = signatureBase64.replace(/^data:image\/png;base64,/, "")
  const buffer = Buffer.from(base64Data, 'base64')
  
  const filename = `${userId}_signature_${Date.now()}.png`
  const baseUploadDir = path.join(process.cwd(), "public", "uploads", "signatures")
  const filepath = path.join(baseUploadDir, filename)
  
  try {
    await mkdir(baseUploadDir, { recursive: true })
    await writeFile(filepath, buffer)
  } catch (e) {
    console.error("Signature save error", e)
    throw new Error("Failed to save signature")
  }

  // Create a record for the signed contract
  await prisma.document.create({
    data: {
      name: `Digital unterschriebener Arbeitsvertrag (${session.user.name || userId})`,
      url: `/uploads/signatures/${filename}`,
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

  return { success: true, url: `/uploads/signatures/${filename}` }
}
