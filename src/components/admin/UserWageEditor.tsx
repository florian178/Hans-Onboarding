"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { updateEmployeeWage } from "@/app/admin/adminActions"
import { useRouter } from "next/navigation"

export function UserWageEditor({ userId, currentWage }: { userId: string, currentWage: number }) {
  const [wage, setWage] = useState(currentWage.toString())
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const handleUpdate = async () => {
    const val = parseFloat(wage)
    if (isNaN(val)) return alert("Bitte einen gültigen Zahlenwert eingeben.")
    
    setIsPending(true)
    const res = await updateEmployeeWage(userId, val)
    setIsPending(false)

    if (res.success) {
      alert("Stundenlohn aktualisiert!")
      router.refresh()
    } else {
      alert("Fehler: " + res.error)
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1rem', 
      alignItems: 'flex-end', 
      padding: '1rem', 
      backgroundColor: 'rgba(0, 113, 227, 0.05)', 
      borderRadius: '12px',
      marginBottom: '2rem'
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: 600, color: '#86868b' }}>INDIVIDUELLER STUNDENLOHN (€)</p>
        <Input 
          type="number" 
          step="0.01" 
          value={wage} 
          onChange={e => setWage(e.target.value)} 
          style={{ marginBottom: 0 }}
        />
      </div>
      <Button onClick={handleUpdate} disabled={isPending}>
        {isPending ? "Speichern..." : "Lohn aktualisieren"}
      </Button>
    </div>
  )
}
