import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { clsx } from "clsx"
import { resetPassword } from "./actions"
import styles from "../login/page.module.css"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>
}) {
  const params = await searchParams
  const sent = params.sent === "1"

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
              ? "✓ Falls ein Konto mit dieser E-Mail existiert, wurde ein neues Passwort verschickt. Bitte auch den Spam-Ordner prüfen."
              : "Gib deine E-Mail-Adresse ein. Du erhältst ein neues Passwort per E-Mail."}
          </p>
        </CardHeader>
        {!sent && (
          <CardContent>
            <form action={resetPassword} className={styles.form}>
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
