"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { 
  LuUsers, 
  LuArchive, 
  LuFileText, 
  LuDollarSign, 
  LuClock, 
  LuStar, 
  LuCalendar,
  LuMenu,
  LuX,
  LuLogOut,
  LuLayoutDashboard
} from "react-icons/lu"
import { clsx } from "clsx"
import styles from "./layout.module.css"
import { signOut } from "next-auth/react"

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { id: "employees", label: "Mitarbeiter", icon: <LuUsers />, path: "/admin" },
    { id: "archive", label: "Archiv", icon: <LuArchive />, path: "/admin/archive" },
    { id: "content", label: "Inhalte", icon: <LuFileText />, path: "/admin/content" },
    { id: "payslips", label: "Lohnzettel", icon: <LuDollarSign />, path: "/admin/payslips" },
    { id: "timesheets", label: "Zeiterfassung", icon: <LuClock />, path: "/admin/timesheets" },
    { id: "benefits", label: "Member Benefits", icon: <LuStar />, path: "/admin/benefits" },
    { id: "planning", label: "Personalplanung", icon: <LuCalendar />, path: "/admin/planning" },
  ]

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin"
    return pathname.startsWith(path)
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
            <Link
              key={item.id}
              href={item.path}
              className={clsx(styles.sideNavItem, isActive(item.path) && styles.sideNavItemActive)}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className={styles.sideNavIcon}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.logoutAction}
            onClick={() => signOut({ redirectTo: "/login" })}
          >
            <LuLogOut />
            Abmelden
          </button>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button className={styles.menuBtn} onClick={() => setIsMenuOpen(true)}>
              <LuMenu />
            </button>
            <h1 className={styles.headerTitle}>Admin Bereich</h1>
          </div>
          <div className={styles.headerRight}>
             <img src="/logo.png" alt="Hans im Club" className={styles.headerLogo} />
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
