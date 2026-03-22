import { signIn } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { clsx } from "clsx"
import styles from "./page.module.css"

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.logoWrapper}>
        <img src="/logo.png" alt="Hans im Club Logo" className={styles.logo} />
      </div>
      <Card className={clsx(styles.loginCard, "glass")}>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <p className={styles.subtitle}>Gib deine E-Mail Adresse ein, um einen passwortlosen Zugang (Magic Link) zu erhalten.</p>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server"
              await signIn("resend", {
                email: formData.get("email"),
                redirectTo: "/", // Middleware will sort out Admin vs Employee destinations
              })
            }}
            className={styles.form}
          >
            <Input 
              type="email" 
              name="email" 
              placeholder="deine.email@beispiel.de" 
              required 
            />
            <Button type="submit" fullWidth>
              Login Link senden
            </Button>
          </form>
          <div className={styles.divider}>oder</div>
          <p className={styles.hint}>Entwickler-Modus (Bypass Magic Link):</p>
          <div className={styles.debugActions}>
            <form action={async () => {
              "use server"
              await prisma.user.upsert({
                where: { email: 'admin@admin.com' },
                update: { role: 'ADMIN' },
                create: { email: 'admin@admin.com', name: 'Admin', role: 'ADMIN', onboardingStatus: { create: { status: 'COMPLETED' } } }
              })
              await signIn("credentials", {
                email: 'admin@admin.com',
                password: 'hans123',
                redirectTo: '/admin'
              })
            }}>
              <Button variant="outline" className={styles.debugBtn} type="submit">Admin Express Login</Button>
            </form>
            <form action={async () => {
              "use server"
              await prisma.user.upsert({
                where: { email: 'test@example.com' },
                update: { role: 'EMPLOYEE' },
                create: { email: 'test@example.com', name: 'Test Mitarbeiter', role: 'EMPLOYEE', onboardingStatus: { create: { status: 'INVITED' } } }
              })
              await signIn("credentials", {
                email: 'test@example.com',
                password: 'hans123',
                redirectTo: '/onboarding'
              })
            }}>
              <Button variant="outline" className={styles.debugBtn} type="submit" style={{ marginTop: '0.5rem' }}>Mitarbeiter Express Login</Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
