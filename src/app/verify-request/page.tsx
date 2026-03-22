import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import styles from "./page.module.css"

export default function VerifyRequestPage() {
  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Mails checken!</CardTitle>
        </CardHeader>
        <CardContent className={styles.content}>
          <p className={styles.message}>
            Ein Magic Link wurde an deine E-Mail Adresse gesendet. Bitte klicke auf den Link in der E-Mail, um dich anzumelden.
          </p>
          <div className={styles.actions}>
            <Link href="/login" passHref legacyBehavior>
              <Button variant="outline" fullWidth>Zurück zum Login</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
