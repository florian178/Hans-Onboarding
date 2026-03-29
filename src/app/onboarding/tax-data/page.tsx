import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import styles from "./page.module.css"

export default async function TaxDataStep() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const existingProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "tax-data" } }
  })

  let d: Record<string, string> = {}
  if (existingProgress?.data) {
    try {
      d = JSON.parse(existingProgress.data)
    } catch {
      // Ignore parse error
    }
  }

  async function saveData(formData: FormData) {
    "use server"
    const session = await auth()
    if (!session?.user) throw new Error("Unauthorized")

    const data = Object.fromEntries(formData.entries())

    await prisma.stepProgress.upsert({
      where: { userId_stepId: { userId: session.user.id!, stepId: "tax-data" } },
      create: {
        userId: session.user.id!,
        stepId: "tax-data",
        completed: false,
        data: JSON.stringify(data)
      },
      update: {
        completed: false,
        data: JSON.stringify(data)
      }
    })

    redirect("/onboarding/tax-data/sign")
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Persönlicher Fragebogen (Lohnabrechnung)</CardTitle>
        <p className={styles.description}>
          Dieses Dokument ist für unsere Steuerberaterin **Corinna Czech** erforderlich. 
          Bitte fülle alle Felder sorgfältig aus.
        </p>
      </CardHeader>
      <CardContent>
        <form action={saveData} className={styles.form}>
          <div className={styles.grid}>
            
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>1. Persönliche Angaben</h3>
            </div>
            
            <Input label="Geburtsname (falls abweichend)" name="maidenName" defaultValue={d.maidenName || ""} />
            
            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Geschlecht</label>
                <div className={styles.radioGroup}>
                    <label><input type="radio" name="gender" value="männlich" defaultChecked={d.gender === "männlich"} required /> männlich</label>
                    <label><input type="radio" name="gender" value="weiblich" defaultChecked={d.gender === "weiblich"} /> weiblich</label>
                </div>
            </div>

            <Input label="Geburtsdatum" type="date" name="birthDate" defaultValue={d.birthDate || ""} required />
            <Input label="Geburtsort & Geburtsland" name="birthPlace" defaultValue={d.birthPlace || ""} required />
            
            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Familienstand</label>
                <select name="maritalStatus" defaultValue={d.maritalStatus || "ledig"} className={styles.select} required>
                    <option value="ledig">ledig</option>
                    <option value="verheiratet">verheiratet</option>
                    <option value="geschieden">geschieden</option>
                    <option value="verwitwet">verwitwet</option>
                </select>
            </div>

            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Schwerbehindert</label>
                <div className={styles.radioGroup}>
                    <label><input type="radio" name="disabled" value="ja" defaultChecked={d.disabled === "ja"} required /> ja</label>
                    <label><input type="radio" name="disabled" value="nein" defaultChecked={d.disabled === "nein" || !d.disabled} /> nein</label>
                </div>
            </div>

            <Input label="Staatsangehörigkeit" name="nationality" defaultValue={d.nationality || "deutsch"} required />
            <Input label="Sozialversicherungsnummer" name="svNumber" defaultValue={d.svNumber || ""} required placeholder="z.B. 12 123456 A 123" />
            
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>2. Bildung (Höchster Abschluss)</h3>
            </div>

            <div className={`${styles.selectWrapper} ${styles.fullWidth}`}>
                <label className={styles.selectLabel}>Schulabschluss</label>
                <div className={styles.verticalRadios}>
                    <label><input type="radio" name="schoolDegree" value="kein" defaultChecked={d.schoolDegree === "kein"} required /> ohne Schulabschluss</label>
                    <label><input type="radio" name="schoolDegree" value="haupt" defaultChecked={d.schoolDegree === "haupt"} /> Haupt-/Volksschulabschluss</label>
                    <label><input type="radio" name="schoolDegree" value="reife" defaultChecked={d.schoolDegree === "reife"} /> Mittlere Reife/gleichwertiger Abschluss</label>
                    <label><input type="radio" name="schoolDegree" value="abitur" defaultChecked={d.schoolDegree === "abitur" || !d.schoolDegree} /> Abitur/Fachabitur</label>
                </div>
            </div>

            <div className={`${styles.selectWrapper} ${styles.fullWidth}`}>
                <label className={styles.selectLabel}>Berufsausbildung</label>
                <div className={styles.verticalRadios}>
                    <label><input type="radio" name="vocationalTraining" value="keine" defaultChecked={d.vocationalTraining === "keine" || !d.vocationalTraining} required /> ohne beruflichen Ausbildungsabschluss</label>
                    <label><input type="radio" name="vocationalTraining" value="anerkannt" defaultChecked={d.vocationalTraining === "anerkannt"} /> Anerkannte Berufsausbildung</label>
                    <label><input type="radio" name="vocationalTraining" value="meister" defaultChecked={d.vocationalTraining === "meister"} /> Meister/Techniker/gleichwertiger Fachschulabschluss</label>
                    <label><input type="radio" name="vocationalTraining" value="bachelor" defaultChecked={d.vocationalTraining === "bachelor"} /> Bachelor</label>
                    <label><input type="radio" name="vocationalTraining" value="master" defaultChecked={d.vocationalTraining === "master"} /> Diplom/Magister/Master/Staatsexamen</label>
                    <label><input type="radio" name="vocationalTraining" value="promotion" defaultChecked={d.vocationalTraining === "promotion"} /> Promotion</label>
                </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>3. Status bei Beginn der Beschäftigung</h3>
            </div>
            
            <div className={`${styles.selectWrapper} ${styles.fullWidth}`}>
                <select name="statusAtStart" defaultValue={d.statusAtStart || "Arbeitnehmer/in"} className={styles.select} required>
                    <option value="Arbeitnehmer/in">Arbeitnehmer/in</option>
                    <option value="Beamter/in">Beamtin/Beamter</option>
                    <option value="Schüler/in">Schüler/in</option>
                    <option value="Student/in">Student/in</option>
                    <option value="Arbeitslose/r">Arbeitslose/r</option>
                    <option value="Hausfrau/Hausmann">Hausfrau/Hausmann</option>
                    <option value="Sonstige">Sonstige</option>
                </select>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>4. Steuer & Krankenkasse</h3>
            </div>
            
            <Input label="Steuer-Identifikationsnummer (11 Ziffern)" name="taxId" defaultValue={d.taxId || ""} required pattern="[0-9]{11}" />
            <Input label="Finanzamt-Nummer (falls bekannt)" name="taxOfficeNumber" defaultValue={d.taxOfficeNumber || ""} />
            
            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Steuerklasse</label>
                <select name="taxClass" defaultValue={d.taxClass || "1"} className={styles.select} required>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                </select>
            </div>

            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Konfession</label>
                <select name="confession" defaultValue={d.confession || "Keine"} className={styles.select} required>
                    <option value="Keine">keine / konfessionslos</option>
                    <option value="RK">römisch-katholisch</option>
                    <option value="EV">evangelisch</option>
                </select>
            </div>

            <Input label="Kinderfreibeträge" type="number" name="children" defaultValue={d.children || "0"} required />
            <Input label="Name der Krankenkasse" name="healthInsurance" defaultValue={d.healthInsurance || ""} required />
            
            <div className={styles.selectWrapper}>
                <label className={styles.selectLabel}>Art der Versicherung</label>
                <div className={styles.radioGroup}>
                    <label><input type="radio" name="healthInsuranceType" value="Gesetzlich" defaultChecked={d.healthInsuranceType === "Gesetzlich" || !d.healthInsuranceType} required /> Gesetzlich</label>
                    <label><input type="radio" name="healthInsuranceType" value="Privat" defaultChecked={d.healthInsuranceType === "Privat"} /> Privat</label>
                </div>
            </div>

            <div className={`${styles.checkboxWrapper} ${styles.fullWidth}`}>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="pensionExemption" defaultChecked={d.pensionExemption === "on"} />
                    Ich beantrage die Befreiung von der Rentenversicherungspflicht (nur bei Minijobs)
                </label>
                <p className={styles.helpText} style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    Hinweis: Minijobber sind grundsätzlich rentenversicherungspflichtig (Eigenanteil von i.d.R. 3,6%). Mit diesem Kreuz kannst du dich von dieser Beitragspflicht befreien lassen.
                </p>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>5. Weitere Beschäftigungen</h3>
            </div>

            <div className={`${styles.selectWrapper} ${styles.fullWidth}`}>
                <label className={styles.selectLabel}>Üben Sie weitere Beschäftigungen aus?</label>
                <div className={styles.radioGroup}>
                    <label><input type="radio" name="otherJobs" value="ja" defaultChecked={d.otherJobs === "ja"} required /> ja</label>
                    <label><input type="radio" name="otherJobs" value="nein" defaultChecked={d.otherJobs === "nein" || !d.otherJobs} /> nein</label>
                </div>
            </div>

            <div className={styles.fullWidth}>
                <label className={styles.selectLabel}>Falls ja: Details (Zeitraum, Arbeitgeber, Verdienst)</label>
                <textarea name="otherJobsDetails" className={styles.textarea} defaultValue={d.otherJobsDetails || ""} placeholder="z.B. Minijob bei XY (500€/Monat)"></textarea>
            </div>

            <div className={`${styles.checkboxWrapper} ${styles.fullWidth}`}>
                <label className={styles.checkboxLabel}>
                    <input type="checkbox" name="beaContradiction" defaultChecked={d.beaContradiction === "on"} />
                    Ich widerspreche der elektronischen Übermittlung von Arbeitsbescheinigungen (Bea)
                </label>
                <p className={styles.helpText} style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    Hinweis: "Bea" ermöglicht der Agentur für Arbeit, Bescheinigungen digital bei uns abzurufen. Ein Widerspruch führt dazu, dass du sie stattdessen in Papierform erhältst. Wir empfehlen, das Feld leer zu lassen.
                </p>
            </div>
          </div>
          
          <div className={styles.actions}>
            <Button type="submit">Speichern & Vorschau ansehen</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
