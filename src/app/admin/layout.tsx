import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminSidebar from "./AdminSidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session?.user || (session.user as { role?: string }).role !== 'ADMIN') {
    redirect("/login")
  }

  return (
    <AdminSidebar>
      {children}
    </AdminSidebar>
  )
}
