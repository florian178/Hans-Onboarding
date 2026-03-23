import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { clsx } from "clsx"
import crypto from "crypto"
import styles from "../login/page.module.css"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const params = await searchParams
  const sent = params.sent === "1"

  async function handleReset(formData: FormData) {
    "use server"
    const email = formData.get("email") as string
    if (!email) return

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
            from: "onboarding@resend.dev",
            to: email,
            subject: "Dein neues Passwort – Hans im Club",
            html: `
              <p>Hallo,</p>
              <p>Du hast eine Passwort-Zurücksetzung für deinen Account beantragt.</p>
              <p>Dein neues Passwort lautet: <strong>${rawPassword}</strong></p>
              <p><a href="${loginUrl}/login">Jetzt einloggen</a></p>
              <p>Bitte ändere dein Passwort nach dem Login in deinen Stammdaten.</p>
            `,
          })
        } catch (e) {
          console.error("[ResetPassword] E-Mail-Fehler:", e)
        }
      }
      console.log(`[ResetPassword] Neues Passwort für ${email}: ${rawPassword}`)
    }

    const { redirect } = await import("next/navigation")
    redirect("/reset-password?sent=1")
  }

  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Hans im Club Logo" className={styles.logo} />
      </div>
      <Card className={clsx(styles.loginCard, "glass")}>
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
          <p className={styles.subtitle}>
            {sent
              ? "Falls ein Konto mit dieser E-Mail existiert, wurde ein neues Passwort verschickt. Bitte auch den Spam-Ordner prüfen."
              : "Gib deine E-Mail-Adresse ein. Du erhältst ein neues Passwort per E-Mail."}
          </p>
        </CardHeader>
        {!sent && (
          <CardContent>
            <form action={handleReset} className={styles.form}>
              <Input
                type="email"
                name="email"
                placeholder="E-Mail Adresse"
                required
              />
              <Button type="submit" fullWidth>
                Neues Passwort anfordern
              </Button>
              <div className={styles.resetLinkWrapper}>
                <a href="/login" className={styles.resetLink}>Zurück zum Login</a>
              </div>
            </form>
          </CardContent>
        )}
        {sent && (
          <CardContent>
            <div className={styles.resetLinkWrapper} style={{ paddingTop: "1rem" }}>
              <a href="/login" className={styles.resetLink}>Zurück zum Login</a>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
