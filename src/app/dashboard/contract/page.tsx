import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
import { ZoomableDocument } from "@/components/ui/ZoomableDocument"

import styles from "../../admin/contracts/[userId]/page.module.css"

const getEndDate = (start?: Date | null | string) => {
  const s = start ? new Date(start) : new Date();
  const e = new Date(s);
  e.setMonth(e.getMonth() + 7);
  e.setDate(0);
  return e.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default async function EmployeeContractPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const userId = session.user.id!

  const document = await prisma.document.findFirst({
    where: { userId, type: "CONTRACT_SIGNED" },
    orderBy: { uploadedAt: "desc" }
  })

  if (!document) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Arbeitsvertrag nicht gefunden</h1>
          <a href="/dashboard" className={styles.backLink}>Zurück zum Dashboard</a>
        </div>
      </div>
    )
  }

  const personalDataProgress = await prisma.stepProgress.findUnique({
    where: { userId_stepId: { userId, stepId: "personal-data" } }
  })

  let personalData = null
  if (personalDataProgress?.data) {
    try {
      personalData = JSON.parse(personalDataProgress.data)
    } catch {
      // ignore
    }
  }

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  const addressLine = personalData ? `${personalData.address}, ${personalData.zipCode} ${personalData.city}` : "Adresse"

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { startDate: true }
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backLink}>← Zurück zum Dashboard</a>
        <PrintButton className={styles.printBtn} />
      </div>

      <ZoomableDocument id="contract-preview">
        <div style={{ padding: '4rem 3.5rem' }}>
        <div className={styles.contractText}>
          <div className={styles.documentLogo}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Hans im Club Logo" />
          </div>
          <h2>Arbeitsvertrag für eine geringfügige Beschäftigung (Minijob)</h2>
          <p>
            zwischen<br/>
            HS Event GmbH, Schützenplatz 14, 01067 Dresden<br/>
            – nachfolgend „Arbeitgeber“ –
          </p>
          <p>und</p>
          <p>
            <strong>{name}</strong>, {addressLine}<br/>
            – nachfolgend „Arbeitnehmer“ –
          </p>
          <p>wird folgender Arbeitsvertrag geschlossen:</p>

          <h3>§1 Beginn des Arbeitsverhältnisses</h3>
          <p>Das Arbeitsverhältnis beginnt am {user?.startDate ? new Date(user.startDate).toLocaleDateString('de-DE') : '18.03.2026'}.</p>

          <h3>§2 Vertragsdauer</h3>
          <p>Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen.<br/>
          Die ersten 3 Monate gelten als Probezeit. Während dieser Zeit kann das Arbeitsverhältnis mit einer Frist von 2 Wochen gekündigt werden.</p>

          <h3>§3 Tätigkeit und Arbeitsort</h3>
          <p>Der Arbeitnehmer wird als Servicekraft / Barkraft im Betrieb<br/>
          „Hans im Club“, Wallstraße 11, 01067 Dresden eingesetzt.<br/>
          Der Arbeitgeber ist berechtigt, dem Arbeitnehmer andere gleichwertige und zumutbare Tätigkeiten zuzuweisen.</p>

          <h3>§4 Vergütung</h3>
          <p>Der Arbeitnehmer erhält einen Stundenlohn in Höhe von 13,90 € brutto.<br/>
          Die Beschäftigung erfolgt im Rahmen eines geringfügigen Beschäftigungsverhältnisses gemäß § 8 SGB IV.<br/>
          Das regelmäßige monatliche Arbeitsentgelt darf die gesetzliche Geringfügigkeitsgrenze (derzeit 603 €) nicht überschreiten.<br/>
          Die Auszahlung erfolgt jeweils zum 15. des Folgemonats auf ein vom Arbeitnehmer benanntes Konto: IBAN {personalData?.iban || '_______________________'}.<br/>
          Der Arbeitgeber führt die pauschalen Abgaben zur Sozialversicherung an die Minijob-Zentrale ab.</p>

          <h3>§5 Arbeitszeit (Arbeit auf Abruf)</h3>
          <p>Die Beschäftigung erfolgt nach Bedarf des Arbeitgebers.<br/>
          Die monatliche Arbeitszeit beträgt maximal 43 Stunden.<br/>
          Die Einsätze erfolgen in der Regel zu folgenden Zeiten:</p>
          <ul>
            <li>Mittwoch: 22:00 – 05:00 Uhr</li>
            <li>Freitag: 22:00 – 05:00 Uhr</li>
            <li>Samstag: 22:00 – 05:00 Uhr</li>
            <li>Feiertage: 22:00 – 05:00 Uhr</li>
          </ul>
          <p>Beginn und Ende der täglichen Arbeitszeit richten sich nach den betrieblichen Erfordernissen.</p>

          <h3>§6 Urlaub</h3>
          <p>Der Arbeitnehmer hat Anspruch auf den gesetzlichen Mindesturlaub.<br/>
          Die Urlaubstage werden anteilig entsprechend der tatsächlichen Arbeitstage berechnet.</p>

          <h3>§7 Krankheit</h3>
          <p>Der Arbeitnehmer ist verpflichtet, dem Arbeitgeber eine Arbeitsunfähigkeit unverzüglich mitzuteilen.<br/>
          Spätestens am dritten Kalendertag ist eine ärztliche Bescheinigung vorzulegen.<br/>
          Im Übrigen gelten die gesetzlichen Vorschriften zur Entgeltfortzahlung im Krankheitsfall.</p>

          <h3>§8 Verschwiegenheit</h3>
          <p>Der Arbeitnehmer verpflichtet sich, über alle Betriebs- und Geschäftsgeheimnisse auch nach Beendigung des Arbeitsverhältnisses Stillschweigen zu bewahren.</p>

          <h3>§9 Nebentätigkeit</h3>
          <p>Eine Nebentätigkeit ist dem Arbeitgeber vorher anzuzeigen und bedarf dessen Zustimmung, sofern berechtigte betriebliche Interessen betroffen sind.</p>

          <h3>§10 Rentenversicherung (Minijob)</h3>
          <p>Der Arbeitnehmer wird darauf hingewiesen, dass grundsätzlich Rentenversicherungspflicht besteht.<br/>
          Er kann sich auf Antrag von der Rentenversicherungspflicht befreien lassen. Der Antrag ist schriftlich gegenüber dem Arbeitgeber zu erklären.</p>

          <h3>§11 Kassen- und Kontrollregelung</h3>
          <p>Der Arbeitnehmer ist verpflichtet, sorgfältig mit Bargeld und Betriebseigentum umzugehen.<br/>
          Taschen- und Personenkontrollen sind ausschließlich in begründeten Einzelfällen zulässig, wenn ein konkreter Verdacht auf Pflichtverletzungen besteht.<br/>
          Dabei sind die Persönlichkeitsrechte des Arbeitnehmers zu wahren.<br/>
          Für vorsätzlich oder grob fahrlässig verursachte Kassendifferenzen haftet der Arbeitnehmer im Rahmen der gesetzlichen Vorschriften.</p>

          <h3>§12 Alkohol- und Drogenverbot</h3>
          <p>Dem Arbeitnehmer ist es untersagt, während der Arbeitszeit sowie vor Dienstantritt in einem Zustand zu erscheinen, der seine Arbeitsfähigkeit beeinträchtigt, insbesondere durch Alkohol oder andere berauschende Mittel.<br/>
          Bei Verstößen ist der Arbeitgeber berechtigt, den Arbeitnehmer von der Arbeitsleistung auszuschließen.<br/>
          Weitere arbeitsrechtliche Maßnahmen (insbesondere Abmahnung oder Kündigung) bleiben vorbehalten.</p>

          <h3>§13 Verhalten bei Nichterscheinen (No-Show)</h3>
          <p>Der Arbeitnehmer ist verpflichtet, vereinbarte Arbeitseinsätze wahrzunehmen.<br/>
          Ist ihm die Arbeitsaufnahme nicht möglich, hat er den Arbeitgeber unverzüglich zu informieren.<br/>
          Ein unentschuldigtes Nichterscheinen stellt eine erhebliche Pflichtverletzung dar und kann arbeitsrechtliche Konsequenzen nach sich ziehen (insbesondere Abmahnung oder Kündigung).<br/>
          Verursacht der Arbeitnehmer durch schuldhaftes Nichterscheinen einen nachweisbaren Schaden, ist er im Rahmen der gesetzlichen Vorschriften zum Ersatz verpflichtet.</p>

          <h3>§14 Kündigung</h3>
          <p>Nach Ablauf der Probezeit gelten die gesetzlichen Kündigungsfristen gemäß § 622 BGB.<br/>
          Die Kündigung bedarf der Schriftform.</p>

          <h3>§15 Ausschlussfristen</h3>
          <p>Ansprüche aus dem Arbeitsverhältnis verfallen, wenn sie nicht innerhalb von 3 Monaten nach Fälligkeit schriftlich geltend gemacht werden.</p>

          <h3>§16 Schlussbestimmungen</h3>
          <p>Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.<br/>
          Sollte eine Bestimmung dieses Vertrages unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
          
          <br/>
          <p>Dresden, {new Date(document.uploadedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p>Ort, Datum</p>
        </div>
        
        <div className={styles.signatureRow}>
           <div className={styles.sigContainer}>
               <div className={styles.employerSigPlaceHolder} style={{ fontSize: '12px' }}>
                 HS Event GmbH vertreten durch Geschäftsführer Florian Herbst
               </div>
             <div className={styles.signatureLine}></div>
             <p className={styles.label}>Unterschrift Arbeitgeber</p>
           </div>
           <div className={styles.sigContainer}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={document.url} alt="Digitale Unterschrift" className={styles.finalSignature} />
             <div className={styles.signatureLine}></div>
             <p className={styles.label}>Unterschrift Arbeitnehmer/-in</p>
           </div>
        </div>
        </div>
      </ZoomableDocument>
    </div>
  )
}
