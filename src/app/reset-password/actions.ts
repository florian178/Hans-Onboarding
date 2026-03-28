"use server"

import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { redirect } from "next/navigation"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function resetPassword(formData: FormData) {
  const crypto = await import("crypto")
  const email = formData.get("email") as string
  if (!email) redirect("/reset-password?sent=1")

  try {
    const user = await (prisma.user.findUnique as any)({ where: { email } })

    if (user) {
      const rawPassword = crypto.randomBytes(4).toString("hex")
      const hashedPassword = crypto.createHash("sha256").update(rawPassword).digest("hex")

      await (prisma.user.update as any)({
        where: { email },
        data: { password: hashedPassword },
      })

      const loginUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

      if (process.env.RESEND_API_KEY) {
        try {
          await resend.emails.send({
            from: "onboarding@hansimclub.de",
            to: email,
            subject: "Dein neues Passwort – Hans im Club",
            html: `
              <p>Hallo,</p>
              <p>Du hast eine Passwort-Zurücksetzung für deinen Account beantragt.</p>
              <p>Dein neues temporäres Passwort lautet: <strong>${rawPassword}</strong></p>
              <p><a href="${loginUrl}/login">Jetzt einloggen</a></p>
              <p>Bitte ändere dein Passwort nach dem ersten Login in deinen Stammdaten.</p>
            `,
          })
        } catch (e) {
          console.error("[ResetPassword] E-Mail-Fehler:", e)
        }
      }
      console.log(`[ResetPassword] Neues Passwort für ${email}: ${rawPassword}`)
    }
  } catch (e) {
    console.error("[ResetPassword] Fehler:", e)
  }

  redirect("/reset-password?sent=1")
}
