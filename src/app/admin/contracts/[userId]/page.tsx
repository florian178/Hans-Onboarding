import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
import { TaxFormPreview } from "@/components/TaxFormPreview"
import { RVBefreiungPreview } from "@/components/RVBefreiungPreview"
import { FireSafetyPreview } from "@/components/FireSafetyPreview"
import { SendToAdvisorButtonClient as SendToAdvisorButton } from "@/components/ui/SendToAdvisorButtonClient"
import { UserWageEditor } from "@/components/admin/UserWageEditor"
import styles from "./page.module.css"

const getEndDate = (start?: Date | null | string) => {
  const s = start ? new Date(start) : new Date();
  const e = new Date(s);
  e.setMonth(e.getMonth() + 7);
  e.setDate(0);
  return e.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default async function ContractPage(props: { params: Promise<{ userId: string }> }) {
  const params = await props.params;
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/unauthorized")

  const { userId } = params

  const steps = await prisma.stepProgress.findMany({
    where: { userId },
  })

  const personalDataStep = steps.find(s => s.stepId === 'personal-data' && s.completed)
  const instructionsStep = steps.find(s => s.stepId === 'instructions' && s.completed)
  const contractStep = steps.find(s => s.stepId === 'contract' && s.completed)
  const videoStep = steps.find(s => s.stepId === 'video' && s.completed)

  const document = await prisma.document.findFirst({
    where: { userId, type: "CONTRACT_SIGNED" },
    orderBy: { uploadedAt: "desc" }
  })



  let personalData = null
  if (personalDataStep?.data) {
    try {
      personalData = JSON.parse(personalDataStep.data)
    } catch {
      // ignore
    }
  }

  const taxDataProgress = steps.find(s => s.stepId === 'tax-data' && s.completed)
  let taxData = null
  if (taxDataProgress?.data) {
    try {
      taxData = JSON.parse(taxDataProgress.data)
    } catch {
      // ignore
    }
  }

  let instructionsData = null
  if (instructionsStep?.data) {
    try {
      instructionsData = JSON.parse(instructionsStep.data)
    } catch {
      // ignore
    }
  }

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  const addressLine = personalData ? `${personalData.address}, ${personalData.zipCode} ${personalData.city}` : "Adresse"

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { startDate: true, hourlyWage: true }
  })

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/admin" className={styles.backLink}>← Zurück zum Dashboard</a>
        {contractStep && taxDataProgress && (
          <SendToAdvisorButton userId={userId} employeeName={name} />
        )}
      </div>

      <div className={styles.auditLog}>
        <h2>Zertifizierungsnachweis & Signatur-Protokoll</h2>
        <p>Dieses Protokoll dient als rechtlicher Nachweis für die digitale Erfassung und Signatur relevanter Dokumente durch den Arbeitnehmer <strong>{name}</strong>.</p>
        
        <div className={styles.tableWrapper}>
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th>Protokollierter Schritt</th>
                <th>Status</th>
                <th>Zeitstempel (Datum & Uhrzeit)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. Erfassung der allgemeinen Stammdaten</td>
                <td>{personalDataStep ? "✅ Erledigt" : "⏳ Ausstehend"}</td>
                <td>{personalDataStep ? new Date(personalDataStep.updatedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " Uhr" : "-"}</td>
              </tr>
              <tr>
                <td>2. Erfassung der steuerlichen Angaben (Personalfragebogen)</td>
                <td>{taxDataProgress ? "✅ Erledigt" : "⏳ Ausstehend"}</td>
                <td>{taxDataProgress ? new Date(taxDataProgress.updatedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " Uhr" : "-"}</td>
              </tr>
              <tr>
                <td>3. Kenntnisnahme gesetzlicher Belehrungen & Anweisungen</td>
                <td>{instructionsStep ? "✅ Digital Signiert" : "⏳ Ausstehend"}</td>
                <td>{instructionsStep ? new Date(instructionsStep.updatedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " Uhr" : "-"}</td>
              </tr>
              <tr>
                <td>4. Unterzeichnung des Arbeitsvertrags</td>
                <td>{contractStep ? "✅ Digital Signiert" : "⏳ Ausstehend"}</td>
                <td>{contractStep ? new Date(contractStep.updatedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " Uhr" : "-"}</td>
              </tr>
              <tr>
                <td>5. Bestätigung des Arbeitsschutz-Videos</td>
                <td>{videoStep ? "✅ Angesehen & Bestätigt" : "⏳ Ausstehend"}</td>
                <td>{videoStep ? new Date(videoStep.updatedAt).toLocaleDateString("de-DE", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " Uhr" : "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className={styles.wageEditorArea}>
        <h2>Vergütung anpassen</h2>
        <UserWageEditor userId={userId} currentWage={user?.hourlyWage || 13.90} />
      </div>

      <div className={styles.contractHeader}>
        <h2>Personalfragebogen (Vorlage Corinna Czech)</h2>
        {taxData && (
          <PrintButton 
            className={styles.printBtn} 
            elementId="tax-questionnaire" 
            filename={`Personalfragebogen_Corinna_Czech_${name.replace(/\s/g, '_')}.pdf`}
            label="Personalfragebogen herunterladen"
          />
        )}
      </div>

      {taxData ? (
        <div className={styles.contractPreview} id="tax-questionnaire" style={{ padding: '0' }}>
          <TaxFormPreview 
            user={user} 
            personalData={personalData} 
            taxData={taxData} 
            taxDataProgressDate={taxDataProgress?.updatedAt} 
            signatureUrl={taxData.signatureUrl} 
          />
        </div>
      ) : (
        <div className={styles.missingContract} style={{ marginBottom: '3rem' }}>
          <p>Der Personalfragebogen wurde noch nicht vollständig ausgefüllt.</p>
        </div>
      )}

      {taxData?.pensionExemption === 'on' && (
        <>
          <div className={styles.contractHeader} style={{ marginTop: '2rem' }}>
            <h2>RV-Befreiung (Antrag)</h2>
            <PrintButton 
              className={styles.printBtn} 
              elementId="rv-befreiung" 
              filename={`RV_Befreiung_${name.replace(/\s/g, '_')}.pdf`}
              label="Antrag als PDF speichern"
            />
          </div>
          <div className={styles.contractPreview} id="rv-befreiung" style={{ padding: '0' }}>
            <RVBefreiungPreview 
              firstName={personalData?.firstName || ''}
              lastName={personalData?.lastName || ''}
              svNumber={taxData?.svNumber || ''}
              signDate={taxDataProgress?.updatedAt}
              startDate={user?.startDate}
              signatureUrl={taxData?.signatureUrl}
            />
          </div>
        </>
      )}

      <div className={styles.contractHeader}>
        <h2>Arbeitsvertrag</h2>
        {document && (
          <PrintButton 
            className={styles.printBtn} 
            filename={`Arbeitsvertrag_${name.replace(/\s/g, '_')}.pdf`}
          />
        )}
      </div>

      {document ? (
        <div className={styles.contractPreview} id="contract-preview">
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
          <p>Der Arbeitnehmer erhält einen Stundenlohn in Höhe von {(user?.hourlyWage || 13.90).toFixed(2).replace('.', ',')} € brutto.<br/>
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
      ) : (
        <div className={styles.missingContract}>
          <p>Der Arbeitsvertrag wurde (noch) nicht digital signiert und es liegt kein PDF vor.</p>
        </div>
      )}

      {instructionsStep && instructionsData?.signature && (
        <>
          <div className={styles.actionHeader} style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Brandschutzbelehrung</h2>
            <PrintButton elementId="fire-safety" label="Brandschutzbelehrung (PDF) herunterladen" />
          </div>

          <div className={styles.contractPreview} style={{ padding: '0', marginTop: '20px', marginBottom: '20px' }}>
            <div id="fire-safety" style={{ minWidth: '700px' }}>
              <FireSafetyPreview 
                employeeName={name}
                signatureUrl={instructionsData.signature}
                signatureDate={instructionsStep.updatedAt}
              />
            </div>
          </div>
        </>
      )}

    </div>
  )
}

