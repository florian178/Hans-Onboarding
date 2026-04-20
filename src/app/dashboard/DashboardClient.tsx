"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { signOut } from "next-auth/react"
import styles from "./page.module.css"
import { LuLayoutDashboard, LuFiles, LuClock, LuCalendar, LuHand, LuStar, LuFileText, LuDollarSign, LuChevronRight, LuMenu, LuX, LuLogOut } from "react-icons/lu"
import { clsx } from "clsx"

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
  summary?: {
    currentMonthEarnings: number
    nextShift: any | null
    openRequests: any[]
  }
}

const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
]

type TabKey = "home" | "docs" | "shifts"

export default function DashboardClient({ user, documents, payslips, summary }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("home")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [docSection, setDocSection] = useState<"general" | "payslips">("general")
  const [myShifts, setMyShifts] = useState<any[]>([])
  const [isUploadingHygiene, setIsUploadingHygiene] = useState(false)

  React.useEffect(() => {
    if (activeTab === "shifts") {
      fetch("/api/planning/my-shifts")
        .then(res => res.json())
        .then(setMyShifts)
    }
  }, [activeTab])

  const handleNavClick = (path: string) => {
    window.location.href = path
  }

  const handleHygieneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingHygiene(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", "Infektionsschutzbelehrung (Hygiene-Zertifikat)")
      formData.append("type", "HYGIENE_CERTIFICATE")

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      })

      if (res.ok) {
        alert("Zertifikat erfolgreich hochgeladen!");
        window.location.reload()
      } else {
        const err = await res.json()
        alert(err.error || "Fehler beim Upload")
      }
    } catch (error) {
      console.error(error)
      alert("Fehler beim Upload")
    } finally {
      setIsUploadingHygiene(false)
    }
  }

  const firstName = user.name?.split(" ")[0] || user.name
  const hygieneDoc = documents.find(d => d.type === "HYGIENE_CERTIFICATE")
  const hasHygieneCertificate = !!hygieneDoc
  
  let showHygieneCard = true
  if (hygieneDoc) {
    const uploadedDate = new Date(hygieneDoc.uploadedAt)
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    
    if (uploadedDate < fiveDaysAgo) {
      showHygieneCard = false
    }
  }

  const navItems = [
    { id: "home", label: "Home", icon: <LuLayoutDashboard />, path: null },
    { id: "docs", label: "Dokumente", icon: <LuFiles />, path: null },
    { id: "timesheets", label: "Zeiterfassung", icon: <LuClock />, path: "/dashboard/timesheets" },
    { id: "shifts", label: "Einsatzpläne", icon: <LuCalendar />, path: null },
    { id: "availability", label: "Verfügbarkeiten", icon: <LuHand />, path: "/dashboard/availability" },
    { id: "benefits", label: "Benefits", icon: <LuStar />, path: "/dashboard/benefits" },
  ]

  const handleTabClick = (item: any) => {
    if (item.path) {
      handleNavClick(item.path)
    } else {
      setActiveTab(item.id)
    }
    setIsMenuOpen(false)
  }

  return (
    <div className={styles.container}>
      {/* Overlay for mobile menu */}
      {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}

      <aside className={clsx(styles.sidebar, isMenuOpen && styles.sidebarOpen)}>
        <div className={styles.sidebarHeader}>
          <img src="/logo.png" alt="Logo" className={styles.sidebarLogo} />
          <button className={styles.closeBtn} onClick={() => setIsMenuOpen(false)}>
            <LuX />
          </button>
        </div>

        <nav className={styles.sideNav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={clsx(styles.sideNavItem, activeTab === item.id && styles.sideNavItemActive)}
              onClick={() => handleTabClick(item)}
            >
              <span className={styles.sideNavIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className={styles.logoutAction}>
            <LuLogOut /> Abmelden
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuBtn} onClick={() => setIsMenuOpen(true)}>
              <LuMenu />
            </button>
            <div>
              <h1 className={styles.title}>Hallo, {firstName}</h1>
              <p className={styles.subtitle}>Dashboard</p>
            </div>
          </div>
          <div className={styles.headerRight}>
             <img src="/logo.png" alt="Hans im Club" className={styles.headerLogo} />
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          {activeTab === "home" && (
            <div className={styles.homeContent}>
              {/* Quick Stats / Motivation */}
              <div className={styles.heroSummary}>
                <Card className={styles.earningsCard}>
                  <div className={styles.earningsLabel}>Verdienst diesen Monat</div>
                  <div className={styles.earningsValue}>
                    {summary?.currentMonthEarnings.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                  <div className={styles.earningsSub}>Basierend auf deinen genehmigten/eingereichten Zeiten</div>
                </Card>

                <div className={styles.newsTicker}>
                   <h2 className={styles.sectionHeading}>Neuigkeiten & Highlights</h2>
                   <p className={styles.newsText}>Willkommen zurück im Hans! Wir freuen uns, dass du Teil des Teams bist. Schaue regelmäßig hier vorbei für Updates zu deinen Dokumenten und Einsatzplänen.</p>
                </div>
              </div>

              {/* Action Items / Notifications */}
              <div className={styles.actionGrid}>
                {/* Next Shift */}
                <Card className={styles.actionCard} onClick={() => setActiveTab("shifts")}>
                  <div className={styles.actionIcon}><LuCalendar /></div>
                  <div className={styles.actionContent}>
                    <h3 className={styles.actionTitle}>Nächster Einsatz</h3>
                    {summary?.nextShift ? (
                      <>
                        <p className={styles.actionText}>
                          <strong>{new Date(summary.nextShift.plan.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}</strong>
                          <br />
                          {summary.nextShift.plan.eventName || 'Veranstaltung'} · {summary.nextShift.startTime} Uhr
                        </p>
                        <div className={styles.actionArrow}><LuChevronRight /></div>
                      </>
                    ) : (
                      <p className={styles.actionText}>Aktuell kein geplanter Einsatz.</p>
                    )}
                  </div>
                </Card>

                {/* Open Availability Requests */}
                <Card className={styles.actionCard} onClick={() => handleNavClick("/dashboard/availability")}>
                  <div className={styles.actionIcon}><LuHand /></div>
                  <div className={styles.actionContent}>
                    <h3 className={styles.actionTitle}>Fristen & Abfragen</h3>
                    {summary?.openRequests && summary.openRequests.length > 0 ? (
                      <>
                        <p className={styles.actionText}>Es gibt {summary.openRequests.length} offene Verfügbarkeitsabfrage(n).</p>
                        <div className={styles.actionArrow}><LuChevronRight /></div>
                      </>
                    ) : (
                      <p className={styles.actionText}>Alle Abfragen erledigt. Top!</p>
                    )}
                  </div>
                </Card>

                {/* Latest Payslip */}
                <Card className={styles.actionCard} onClick={() => { setActiveTab("docs"); setDocSection("payslips"); }}>
                  <div className={styles.actionIcon}><LuDollarSign /></div>
                  <div className={styles.actionContent}>
                    <h3 className={styles.actionTitle}>Lohnzettel</h3>
                    {payslips.length > 0 ? (
                      <>
                        <p className={styles.actionText}>Dein neuester Lohnzettel ({MONTHS[payslips[0].month - 1]}) ist online.</p>
                        <div className={styles.actionArrow}><LuChevronRight /></div>
                      </>
                    ) : (
                      <p className={styles.actionText}>Bisher keine Lohnzettel hochgeladen.</p>
                    )}
                  </div>
                </Card>

                {/* Hygiene Training */}
                {showHygieneCard && (
                  <div style={{ backgroundColor: hasHygieneCertificate ? 'var(--surface)' : 'rgba(223, 123, 41, 0.05)', borderColor: hasHygieneCertificate ? 'var(--border)' : 'var(--brand-primary)', borderRadius: 'var(--radius-xl)', padding: '2px' }}>
                    <Card className={styles.actionCard}>
                      <div className={styles.actionIcon}><LuFileText /></div>
                    <div className={styles.actionContent}>
                      <h3 className={styles.actionTitle}>Hygiene-Schulung</h3>
                      {hasHygieneCertificate ? (
                        <p className={styles.actionText}>Zertifikat erfolgreich hochgeladen. Vielen Dank!</p>
                      ) : (
                        <>
                          <p className={styles.actionText} style={{ marginBottom: '10px' }}>
                            Bitte absolviere innerhalb von 4 Wochen nach Start die Online-Hygieneschulung (Metro).
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', zIndex: 10, position: 'relative' }}>
                            <a href="https://kw.my/jEM8PK/#/" target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">Zur Schulung</Button>
                            </a>
                            <div style={{ display: 'inline-block' }}>
                              <Button 
                                variant="primary" 
                                size="sm" 
                                type="button"
                                onClick={() => document.getElementById("hygiene-upload-input")?.click()}
                                disabled={isUploadingHygiene}
                              >
                                {isUploadingHygiene ? "Lädt..." : "Zertifikat hochladen"}
                              </Button>
                              <input 
                                id="hygiene-upload-input"
                                type="file" 
                                accept=".pdf,image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleHygieneUpload}
                                disabled={isUploadingHygiene}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "docs" && (
            <>
              {/* Sub-section toggle for docs */}
              <div className={styles.subTabs}>
                <button
                  className={`${styles.subTab} ${docSection === "general" ? styles.subTabActive : ""}`}
                  onClick={() => setDocSection("general")}
                >
                  Allgemeine Dokumente
                </button>
                <button
                  className={`${styles.subTab} ${docSection === "payslips" ? styles.subTabActive : ""}`}
                  onClick={() => setDocSection("payslips")}
                >
                  Lohnzettel
                </button>
              </div>

              {docSection === "general" ? (
                <div className={styles.grid}>
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <Card key={doc.id} className={styles.docCard}>
                        <span className={styles.docIcon}><LuFileText /></span>
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
                </div>
              ) : (
                <div className={styles.grid}>
                  {payslips.length > 0 ? (
                    payslips.sort((a, b) => b.year - a.year || b.month - a.month).map((slip) => (
                      <Card key={slip.id} className={styles.docCard}>
                        <span className={styles.docIcon}><LuDollarSign /></span>
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
                </div>
              )}
            </>
          )}

          {activeTab === "shifts" && (
            <div className={styles.grid}>
              {myShifts.length > 0 ? (
                myShifts.map((a: any) => (
                  <Card key={a.id} className={styles.docCard}>
                    <div className={styles.shiftCard}>
                      <h3 className={styles.shiftDate}>{new Date(a.plan.date).toLocaleDateString("de-DE", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h3>
                      <div className={styles.shiftEvent}>{a.plan.eventName || 'Veranstaltung'}</div>
                      <div className={styles.shiftDetails}>
                        <div><span className={styles.shiftLabel}>Bereich</span><div className={styles.shiftValue}>{a.area}</div></div>
                        <div><span className={styles.shiftLabel}>Rolle</span><div className={styles.shiftValue}>{a.role || '-'}</div></div>
                        <div><span className={styles.shiftLabel}>Beginn</span><div className={styles.shiftValue}>{a.startTime || '??:??'}</div></div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <p>Du bist aktuell in keinem veröffentlichten Einsatzplan eingeteilt.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

