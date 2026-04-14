"use client"
import React, { useState } from "react"
import { Input } from "@/components/ui/Input"
import styles from "./page.module.css"

interface OtherJobsToggleProps {
  defaultValue: string
  data: Record<string, string>
}

export function OtherJobsToggle({ defaultValue, data: d }: OtherJobsToggleProps) {
  const [showDetails, setShowDetails] = useState(defaultValue === "ja")

  return (
    <>
      <div className={`${styles.selectWrapper} ${styles.fullWidth}`}>
        <label className={styles.selectLabel}>Üben Sie neben dieser Beschäftigung noch weitere Beschäftigungen aus oder beziehen Sie eine Rente?</label>
        <div className={styles.radioGroup}>
          <label>
            <input type="radio" name="otherJobs" value="ja" checked={showDetails} onChange={() => setShowDetails(true)} required /> ja
          </label>
          <label>
            <input type="radio" name="otherJobs" value="nein" checked={!showDetails} onChange={() => setShowDetails(false)} /> nein
          </label>
        </div>
      </div>

      {showDetails && (
        <div className={`${styles.fullWidth} ${styles.otherJobsBlock}`}>
          <p className={styles.helpText} style={{ marginBottom: '10px' }}>
            Bitte gib <strong>jede weitere Beschäftigung</strong> einzeln an.
          </p>
          <Input label="1. Arbeitgeber (Name & Ort)" name="otherJob1Employer" defaultValue={d.otherJob1Employer || ""} />
          <div className={styles.grid} style={{ marginTop: '8px' }}>
            <Input label="Art der Beschäftigung" name="otherJob1Type" defaultValue={d.otherJob1Type || ""} placeholder="z.B. Minijob, sv-pflichtig, selbständig" />
            <Input label="Monatsverdienst (brutto)" name="otherJob1Income" defaultValue={d.otherJob1Income || ""} placeholder="z.B. 450€" />
          </div>
          <div className={styles.grid} style={{ marginTop: '8px' }}>
            <Input label="Beginn" type="date" name="otherJob1Start" defaultValue={d.otherJob1Start || ""} />
            <Input label="Ende (falls befristet)" type="date" name="otherJob1End" defaultValue={d.otherJob1End || ""} />
          </div>
          <hr className={styles.divider} />
          <Input label="2. Arbeitgeber (Name & Ort, falls zutreffend)" name="otherJob2Employer" defaultValue={d.otherJob2Employer || ""} />
          <div className={styles.grid} style={{ marginTop: '8px' }}>
            <Input label="Art der Beschäftigung" name="otherJob2Type" defaultValue={d.otherJob2Type || ""} placeholder="z.B. Minijob, sv-pflichtig, selbständig" />
            <Input label="Monatsverdienst (brutto)" name="otherJob2Income" defaultValue={d.otherJob2Income || ""} placeholder="z.B. 450€" />
          </div>
          <div className={styles.grid} style={{ marginTop: '8px' }}>
            <Input label="Beginn" type="date" name="otherJob2Start" defaultValue={d.otherJob2Start || ""} />
            <Input label="Ende (falls befristet)" type="date" name="otherJob2End" defaultValue={d.otherJob2End || ""} />
          </div>
          <textarea name="otherJobsDetails" className={styles.textarea} defaultValue={d.otherJobsDetails || ""} placeholder="Weitere Anmerkungen zu Beschäftigungen (optional)" style={{ marginTop: '10px' }}></textarea>
        </div>
      )}
    </>
  )
}
