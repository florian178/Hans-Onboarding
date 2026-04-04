import React from "react"
import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { clsx } from "clsx"
import styles from "./layout.module.css"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect("/login")
  }

  return (
    <div className={styles.adminLayout}>
      <header className={clsx(styles.header, "glass")}>
        <div className={styles.headerContent}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Hans im Club Logo" className={styles.logoImage} />
          <div className={styles.nav}>
            <Link href="/admin">Mitarbeiter</Link>
            <Link href="/admin/archive">Archiv</Link>
            <Link href="/admin/content">Inhalte</Link>
            <Link href="/admin/payslips">Lohnzettel</Link>
            <Link href="/admin/timesheets">Zeiterfassung</Link>
            <form action={async () => {
               "use server"
               await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="ghost" size="sm" type="submit">Logout</Button>
            </form>
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
