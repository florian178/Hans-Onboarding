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
          <CardTitle>HANS IM CLUB - LOGIN</CardTitle>
          <p className={styles.subtitle}>Herzlich willkommen! Bitte melde dich mit deinen Zugangsdaten an.</p>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server"
              await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirectTo: "/",
              })
            }}
            className={styles.form}
          >
            <Input 
              type="email" 
              name="email" 
              placeholder="E-Mail Adresse" 
              required 
            />
            <Input 
              type="password" 
              name="password" 
              placeholder="Passwort" 
              required 
            />
            <Button type="submit" fullWidth>
              Einloggen
            </Button>
            <div className={styles.resetLinkWrapper}>
              <a href="/reset-password" className={styles.resetLink}>Passwort vergessen?</a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
