"use server"

import { put, del } from "@vercel/blob"
import { auth } from "@/auth"

export async function uploadBenefitLogo(formData: FormData): Promise<string | null> {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") return null

  const file = formData.get("file") as File
  if (!file || file.size === 0) return null

  const filename = `benefits/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
  
  try {
    const blob = await put(filename, file, { access: 'public' })
    return blob.url
  } catch (e) {
    console.error("Vercel Blob Upload error", e)
    return null
  }
}

export async function deleteBenefitLogo(url: string) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") return

  if (url.includes("blob.vercel-storage.com")) {
    try {
      await del(url)
    } catch (e) {
      console.error("Could not delete blob", e)
    }
  }
}
