"use server"

import { put, del } from "@vercel/blob"
import { auth } from "@/auth"

export async function uploadBenefitLogo(formData: FormData): Promise<{ url: string | null; error?: string }> {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { url: null, error: "Unauthorized" }
  }

  const file = formData.get("logoFile") as File
  if (!file || file.size === 0) return { url: null, error: "No file provided" }

  const filename = `benefits/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
  
  try {
    const blob = await put(filename, file, { access: 'public' })
    return { url: blob.url }
  } catch (e: any) {
    console.error("Vercel Blob Upload error", e)
    return { url: null, error: e.message || "Unknown Blob Error" }
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
