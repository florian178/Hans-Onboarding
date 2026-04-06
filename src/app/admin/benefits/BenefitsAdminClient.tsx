"use client"
import React, { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { uploadBenefitLogo } from "./actions"
import styles from "./admin.module.css"

export default function BenefitsAdminClient({ initialBenefits }: { initialBenefits: any[] }) {
  const [benefits, setBenefits] = useState(initialBenefits)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [partnerName, setPartnerName] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [discount, setDiscount] = useState("")
  const [conditions, setConditions] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [sortOrder, setSortOrder] = useState(0)
  const [existingLogoUrl, setExistingLogoUrl] = useState("")

  const resetForm = () => {
    setPartnerName("")
    setTitle("")
    setDescription("")
    setDiscount("")
    setConditions("")
    setWebsiteUrl("")
    setIsActive(true)
    setSortOrder(0)
    setExistingLogoUrl("")
    setEditingId(null)
    setIsFormOpen(false)
  }

  const handleEdit = (b: any) => {
    setPartnerName(b.partnerName)
    setTitle(b.title)
    setDescription(b.description)
    setDiscount(b.discount || "")
    setConditions(b.conditions || "")
    setWebsiteUrl(b.websiteUrl || "")
    setIsActive(b.isActive)
    setSortOrder(b.sortOrder)
    setExistingLogoUrl(b.partnerLogo || "")
    setEditingId(b.id)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Soll dieser Benefit wirklich gelöscht werden?")) return
    
    await fetch(`/api/benefits/${id}`, { method: "DELETE" })
    setBenefits(benefits.filter(b => b.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const file = formData.get("logoFile") as File
      let partnerLogo = existingLogoUrl

      // Handle logo upload if a new file is selected
      if (file && file.size > 0) {
        const uploadRes = await uploadBenefitLogo(formData)
        if (uploadRes.error) {
          alert("Fehler beim Logo Upload: " + uploadRes.error)
          setIsLoading(false)
          return
        }
        if (uploadRes.url) partnerLogo = uploadRes.url
      }

      const payload = {
        partnerName,
        title,
        description,
        discount,
        conditions,
        websiteUrl,
        isActive,
        sortOrder,
        partnerLogo
      }

      if (editingId) {
        const res = await fetch(`/api/benefits/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const updated = await res.json()
        setBenefits(benefits.map(b => (b.id === editingId ? updated : b)).sort((a,b) => a.sortOrder - b.sortOrder))
      } else {
        const res = await fetch("/api/benefits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        const created = await res.json()
        setBenefits([...benefits, created].sort((a,b) => a.sortOrder - b.sortOrder))
      }
      
      resetForm()
    } catch (e) {
      console.error(e)
      alert("Ein Fehler ist aufgetreten.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Member Benefits Verwaltung</h1>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>+ Neues Benefit anlegen</Button>
        )}
      </div>

      {isFormOpen && (
        <Card className={styles.formCard}>
          <CardHeader>
            <CardTitle>{editingId ? "Benefit bearbeiten" : "Neues Benefit anlegen"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <Input label="Partner / Unternehmen" value={partnerName} onChange={e => setPartnerName(e.target.value)} required />
                <Input label="Titel (z.B. 20% auf Drinks)" value={title} onChange={e => setTitle(e.target.value)} required />
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.label}>Beschreibung</label>
                  <textarea 
                    className={styles.textarea} 
                    rows={3} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    required 
                  />
                </div>

                <Input label="Rabatt/Vorteil (kurz)" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="z.B. -10%" />
                <Input label="Bedingungen / Hinweise" value={conditions} onChange={e => setConditions(e.target.value)} placeholder="Nur Di-Do einlösbar" />
                
                <Input label="Sortierung (Zahl, 0 ist ganz oben)" type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
                <Input label="Webseite (URL)" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://partner-website.de" />
                
                <div className={styles.checkboxGroup}>
                  <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  <label htmlFor="isActive">Aktiv (Für Mitarbeiter sichtbar)</label>
                </div>
              </div>

              <div className={styles.fileInputWrapper}>
                <label className={styles.label}>Partner-Logo {existingLogoUrl && "(Neu hochladen ersetzt das alte)"}</label>
                {existingLogoUrl && (
                  <div className={styles.currentLogoPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={existingLogoUrl} alt="Vorschau" height={40} />
                  </div>
                )}
                <input type="file" name="logoFile" accept="image/*" className={styles.fileInput} />
              </div>

              <div className={styles.formActions}>
                <Button type="button" variant="outline" onClick={resetForm}>Abbrechen</Button>
                <Button type="submit" disabled={isLoading}>{isLoading ? "Speichern..." : "Benefit speichern"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className={styles.benefitsList}>
        {benefits.length === 0 ? (
          <p className={styles.empty}>Momentan sind keine Benefits angelegt.</p>
        ) : (
          benefits.map((b) => (
            <Card key={b.id} className={`${styles.benefitItem} ${!b.isActive ? styles.inactive : ""}`}>
              <CardContent className={styles.benefitItemContent}>
                {b.partnerLogo && (
                  <div className={styles.logoCol}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.partnerLogo} alt={b.partnerName} />
                  </div>
                )}
                <div className={styles.infoCol}>
                  <div className={styles.headerRow}>
                    <h3>{b.partnerName}</h3>
                    {!b.isActive && <span className={styles.statusBadge}>Inaktiv</span>}
                  </div>
                  <strong>{b.title}</strong>
                  <p>{b.description}</p>
                </div>
                <div className={styles.actionCol}>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(b)}>Bearbeiten</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(b.id)}>Löschen</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
