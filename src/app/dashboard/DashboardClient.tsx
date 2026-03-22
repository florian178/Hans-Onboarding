"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { handleSignOut } from "./actions"
import styles from "./page.module.css"

interface Document {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: Date
}

interface Payslip {
  id: string
  month: number
  year: number
  url: string
  uploadedAt: Date
}

interface DashboardClientProps {
  user: {
    name: string | null
    email: string | null
    startDate: Date | null
  }
  documents: Document[]
  payslips: Payslip[]
}

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
]

export default function DashboardClient({ user, documents, payslips }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "payslips">("docs")

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Hallo, {user.name || "Mitarbeiter/-in"}</h1>
          <p className={styles.subtitle}>Willkommen in deinem Mitarbeiter-Bereich.</p>
        </div>
        <form action={handleSignOut}>
          <Button variant="ghost" type="submit">Abmelden</Button>
        </form>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === "docs" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          Meine Dokumente
        </button>
        <button 
          className={`${styles.tab} ${activeTab === "payslips" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("payslips")}
        >
          Lohnzettel
        </button>
      </div>

      <div className={styles.grid}>
        {activeTab === "docs" ? (
          <>
            {documents.length > 0 ? (
              documents.map((doc) => (
                <Card key={doc.id} className={styles.docCard}>
                  <span className={styles.docIcon}>📄</span>
                  <h3 className={styles.docTitle}>{doc.name}</h3>
                  <p className={styles.docInfo}>Hochgeladen am {new Date(doc.uploadedAt).toLocaleDateString("de-DE")}</p>
                  <a href={doc.type === "CONTRACT_SIGNED" ? "/dashboard/contract" : doc.url} target={doc.type === "CONTRACT_SIGNED" ? undefined : "_blank"} rel="noopener noreferrer">
                    <Button fullWidth variant="outline">Anschauen / Download</Button>
                  </a>
                </Card>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>Noch keine Dokumente verfügbar.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {payslips.length > 0 ? (
              payslips.sort((a, b) => b.year - a.year || b.month - a.month).map((slip) => (
                <Card key={slip.id} className={styles.docCard}>
                  <span className={styles.docIcon}>💰</span>
                  <h3 className={styles.docTitle}>Lohnzettel {MONTHS[slip.month - 1]} {slip.year}</h3>
                  <p className={styles.docInfo}>Bereitgestellt am {new Date(slip.uploadedAt).toLocaleDateString("de-DE")}</p>
                  <a href={slip.url} target="_blank" rel="noopener noreferrer">
                    <Button fullWidth variant="outline">Herunterladen</Button>
                  </a>
                </Card>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>Noch keine Lohnzettel verfügbar.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
