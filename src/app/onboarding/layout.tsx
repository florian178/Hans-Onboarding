import React from "react"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { OnboardingStepper } from "@/components/OnboardingStepper"
import { Button } from "@/components/ui/Button"
import { clsx } from "clsx"
import styles from "./layout.module.css"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user || (session.user as { role?: string }).role !== 'EMPLOYEE') {
    redirect("/login")
  }

  return (
    <div className={styles.container}>
      <header className={clsx(styles.header, "glass")}>
        <div className={styles.headerContent}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Hans im Club Logo" className={styles.logoImage} />
          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}>
            <Button variant="ghost" size="sm" type="submit">Logout</Button>
          </form>
        </div>
      </header>
      
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <aside className={styles.sidebar}>
            <OnboardingStepper />
          </aside>
          <div className={styles.content}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
