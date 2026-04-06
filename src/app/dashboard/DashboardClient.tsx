"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { signOut } from "next-auth/react"
import styles from "./page.module.css"

interface Document {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: string
}

interface Payslip {
  id: string
  month: number
  year: number
  url: string
  uploadedAt: string
}

interface DashboardClientProps {
  user: {
    name: string | null
    email: string | null
    startDate: string | null
  }
  documents: Document[]
  payslips: Payslip[]
}

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
]

export default function DashboardClient({ user, documents, payslips }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"docs" | "payslips" | "shifts">("docs")
  const [myShifts, setMyShifts] = useState<any[]>([])

  React.useEffect(() => {
    if (activeTab === "shifts") {
      fetch("/api/planning/my-shifts")
        .then(res => res.json())
        .then(setMyShifts)
    }
  }, [activeTab])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Hans im Club Logo" className={styles.headerLogo} />
          <div>
            <h1 className={styles.title}>Hallo, {user.name}</h1>
            <p className={styles.subtitle}>Willkommen in deinem Mitarbeiter-Bereich.</p>
          </div>
        </div>
        <div>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: "/login" })}>Abmelden</Button>
        </div>
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
        <button 
          className={`${styles.tab} ${activeTab === "shifts" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("shifts")}
        >
          Einsatzpläne
        </button>
        <button 
          className={styles.tab}
          onClick={() => window.location.href = '/dashboard/timesheets'}
        >
          Zeiterfassung
        </button>
        <button 
          className={styles.tab}
          onClick={() => window.location.href = '/dashboard/benefits'}
        >
          Member Benefits
        </button>
        <button 
          className={styles.tab}
          onClick={() => window.location.href = '/dashboard/availability'}
        >
          Verfügbarkeiten
        </button>
      </div>

      <div className={styles.grid}>
        {activeTab === "shifts" ? (
          <div style={{ gridColumn: '1 / -1' }}>
            {myShifts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {myShifts.map((a: any) => (
                  <Card key={a.id} className={styles.docCard}>
                    <div style={{ padding: '1.5rem' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{new Date(a.plan.date).toLocaleDateString("de-DE", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h3>
                      <div style={{ color: '#0071e3', fontWeight: 600, marginBottom: '0.5rem' }}>{a.plan.eventName || 'Veranstaltung'}</div>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                         <div>
                            <span style={{ fontSize: '0.8rem', color: '#86868b', textTransform: 'uppercase' }}>Bereich</span>
                            <div style={{ fontWeight: 600 }}>{a.area}</div>
                         </div>
                         <div>
                            <span style={{ fontSize: '0.8rem', color: '#86868b', textTransform: 'uppercase' }}>Rolle</span>
                            <div style={{ fontWeight: 600 }}>{a.role || '-'}</div>
                         </div>
                         <div>
                            <span style={{ fontSize: '0.8rem', color: '#86868b', textTransform: 'uppercase' }}>Beginn</span>
                            <div style={{ fontWeight: 600 }}>{a.startTime || '??:??'}</div>
                         </div>
                      </div>
                      {a.note && <p style={{ marginTop: '1rem', fontSize: '0.9rem', fontStyle: 'italic', color: '#86868b' }}>Notiz: {a.note}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <p>Du bist aktuell in keinem veröffentlichten Einsatzplan eingeteilt.</p>
              </div>
            )}
          </div>
        ) : activeTab === "docs" ? (
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
