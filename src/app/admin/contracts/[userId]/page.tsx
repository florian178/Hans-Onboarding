import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
import { TaxFormPreview } from "@/components/TaxFormPreview"
import { RVBefreiungPreview } from "@/components/RVBefreiungPreview"
import styles from "./page.module.css"

const getEndDate = (start?: Date | null | string) => {
  const s = start ? new Date(start) : new Date();
  const e = new Date(s);
  e.setMonth(e.getMonth() + 6);
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

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  const addressLine = personalData ? `${personalData.address}, ${personalData.zipCode} ${personalData.city}` : "Adresse"

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { startDate: true }
  })

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href="/admin" className={styles.backLink}>← Zurück zum Dashboard</a>
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
          <h2>Arbeitsvertrag einer geringfügigen Beschäftigung</h2>
          <p>
            Zwischen HS Event GmbH, Schützenplatz 14, 01067 Dresden<br/>
            (Name und Adresse des Arbeitgebers) - nachfolgend „Arbeitgeber“ genannt -
          </p>
          <p>und</p>
          <p>
            <strong>{name}</strong>, {addressLine}<br/>
            - nachfolgend „Arbeitnehmer/-in“ genannt -
          </p>
          <p>wird folgender Arbeitsvertrag geschlossen:</p>

          <h3>§ 1 Arbeitsverhältnis</h3>
          <p>Das Arbeitsverhältnis beginnt am {user?.startDate ? new Date(user.startDate).toLocaleDateString('de-DE') : '18.03.2026'}. Der Arbeitnehmer wird im Rahmen eines geringfügigen Beschäftigungsverhältnisses auf Anfrage bis zu 603 Euro beschäftigt.</p>

          <h3>§ 2 Vertragsdauer</h3>
          <p>Das Arbeitsverhältnis wird auf befristete Zeit geschlossen, einschließlich bis zum {getEndDate(user?.startDate)}. Nach Ablauf der Frist verlängert sich der Arbeitsvertrag automatisch um jeweils einen Monat bis zur Kündigung.</p>

          <h3>§ 3 Tätigkeit und Aufgabengebiet</h3>
          <p>Der Arbeitnehmer/ die Arbeitnehmerin wird als Servicekraft/ Barkraft im “Hans im Club”, Wallstraße 11, 01067 Dresden, eingestellt.</p>

          <h3>§ 4 Arbeitsvergütung</h3>
          <p>Der Arbeitnehmer/ die Arbeitnehmerin erhält einen Stundenlohn von 13,90€/h (höchstens 603 Euro). Die Vergütung wird jeweils am 15. des Folgemonats zahlbar auf das vom Arbeitnehmer angegebene Konto überwiesen: IBAN {personalData?.iban || '_______________________'}.</p>
          <p>Der Arbeitgeber leistet die Pauschalabgabe in der jeweils gesetzlich geschuldeten Höhe an die zentrale Einzugsstelle (Bundesknappschaft).</p>

          <h3>§ 5 Arbeitszeit</h3>
          <p>Der Arbeitnehmer/ die Arbeitnehmerin arbeitet beim Arbeitgeber auf Anfrage<br/>
          Die regelmäßige monatliche Arbeitszeit beträgt maximal 43,38h Stunden.</p>
          <p>Die grundsätzliche Verteilung der wöchentlichen Arbeitszeit erfolgt in der Regel an Wochentagen und Zeiten:</p>
          <ul>
            <li>Mittwoch: 22:00 Uhr bis 05:00 Uhr</li>
            <li>Freitag: 22:00 Uhr bis 05:00 Uhr</li>
            <li>Samstag: 22:00 Uhr bis 05:00 Uhr</li>
            <li>Feiertage: 22:00 Uhr bis 05:00 Uhr</li>
          </ul>

          <h3>§ 6 Krankheit</h3>
          <p>Die Arbeitsunfähigkeit ist dem Arbeitgeber unverzüglich mitzuteilen. Außerdem ist vor Ablauf des dritten Kalendertags nach Beginn der Erkrankung eine ärztliche Bescheinigung über die Arbeitsunfähigkeit und deren voraussichtliche Dauer vorzulegen.</p>

          <h3>§ 8 Verschwiegenheitspflicht</h3>
          <p>Der Arbeitnehmer/ die Arbeitnehmerin verpflichtet sich, während der Dauer des Arbeitsverhältnisses und auch nach dem Ausscheiden, über alle Betriebs- und Geschäftsgeheimnisse Stillschweigen zu bewahren.</p>

          <h3>§ 9 Nebentätigkeit</h3>
          <p>Jede entgeltliche oder das Arbeitsverhältnis beeinträchtigende Nebenbeschäftigung ist nur mit Zustimmung des Arbeitgebers zulässig.</p>

          <h3>§10 Hinweis bzgl. des Verzichts auf Rentenversicherungsfreiheit</h3>
          <p>Der Arbeitnehmer hat die Möglichkeit, jederzeit durch schriftliche Erklärung gegenüber dem Arbeitgeber auf seine Versicherungsfreiheit in der gesetzlichen Rentenversicherung zu verzichten. Der Verzicht kann nur für die Zukunft und im Falle der Ausübung mehrerer geringfügiger Beschäftigungen nur einheitlich für alle Beschäftigungen erklärt werden.</p>
          <p>Wird der Verzicht erklärt, ist der Arbeitnehmer verpflichtet, den gesetzlichen Pauschalbeitrag zur Rentenversicherung von 15 % des Arbeitsentgelts auf den jeweils geltenden Rentenversicherungsbeitrag aufzustocken. Durch diese eigenen Zuzahlungen werden volle Leistungsansprüche in der Rentenversicherung erworben.</p>

          <h3>§11 Sonstige Bestimmungen</h3>
          <p>Während der Arbeit darf der Arbeitnehmer/ die Arbeitnehmerin maximal 50,00€ Bargeld mit sich führen. Wenn ein Mitarbeiter aus irgendeinem Grund an einem bestimmten Arbeitstag über mehr Bargeld verfügt, ist er verpflichtet, dies zu melden. Der Mitarbeiter ist mit stichprobenartigen Kontrollen von Taschen oder Jacken einverstanden.</p>
          
          <br/>
          <p>Dresden, {new Date(document.uploadedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p>Ort, Datum</p>
        </div>
        
        <div className={styles.signatureRow}>
           <div className={styles.sigContainer}>
             <div className={styles.employerSigPlaceHolder}>
               HS Event GmbH
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
    </div>
  )
}
