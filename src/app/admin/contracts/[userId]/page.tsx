import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
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
          <div className={styles.taxFormWrapper} style={{ 
            fontFamily: 'Arial, sans-serif', 
            color: '#000', 
            lineHeight: '1.2', 
            fontSize: '11px',
            backgroundColor: '#fff',
            padding: '40px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <h1 style={{ fontSize: '18px', margin: '0 0 5px 0', fontWeight: 'bold' }}>Personalfragebogen</h1>
                <p style={{ margin: 0 }}>für geringfügig (Minijob) oder kurzfristig Beschäftigte</p>
                <p style={{ fontSize: '10px', color: '#666' }}>(grau hinterlegte Felder sind vom Arbeitgeber auszufüllen)</p>
                <p style={{ marginTop: '10px' }}><strong>Firma:</strong> HS Event GmbH</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '24px', fontWeight: 'bold' }}> <span style={{ padding: '2px 5px', border: '2px solid #000' }}>C C</span></div>
                 <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '5px' }}>Corinna Czech</div>
                 <div style={{ fontSize: '11px' }}>Steuerberaterin</div>
              </div>
            </div>

            {/* Employee Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
              <div>
                <p style={{ marginBottom: '5px' }}>Name des Mitarbeiters</p>
                <div style={{ backgroundColor: '#eeeeee', padding: '8px', minHeight: '30px', border: '1px solid #ccc' }}>{name}</div>
              </div>
              <div>
                <p style={{ marginBottom: '5px' }}>Personalnummer</p>
                <div style={{ backgroundColor: '#eeeeee', padding: '8px', minHeight: '30px', border: '1px solid #ccc' }}></div>
              </div>
            </div>

            {/* Persönliche Angaben */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={4} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Persönliche Angaben</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '5px' }}>Familienname<br/>{taxData.maidenName ? `(geb. ${taxData.maidenName})` : ''}</td>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.lastName}</td>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '5px' }}>Vorname</td>
                  <td style={{ width: '25%', border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.firstName}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Straße und Hausnummer</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.address}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>PLZ, Ort</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.zipCode} {personalData?.city}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Geburtsdatum</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData.birthDate ? new Date(taxData.birthDate).toLocaleDateString('de-DE') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Geschlecht</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    [ {taxData.gender === 'männlich' ? 'X' : ' '} ] männlich &nbsp; [ {taxData.gender === 'weiblich' ? 'X' : ' '} ] weiblich
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Versicherungsnummer<br/><span style={{ fontSize: '9px' }}>gem. Sozialvers.-Ausweis</span></td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData.svNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Familienstand</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData.maritalStatus}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Geburtsort, -land</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData.birthPlace}</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Schwerbehindert</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>
                    [ {taxData.disabled === 'ja' ? 'X' : ' '} ] ja &nbsp; [ {taxData.disabled === 'nein' ? 'X' : ' '} ] nein
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Staatsangehörigkeit</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData.nationality}</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Arbeitnehmernummer<br/>Sozialkasse - Bau</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee', verticalAlign: 'top' }}></td>
                </tr>
                <tr>
                   <td style={{ border: '1px solid #000', padding: '5px' }}>IBAN</td>
                   <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.iban}</td>
                   <td style={{ border: '1px solid #000', padding: '5px' }}>BIC</td>
                   <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.bic || '-'}</td>
                </tr>
              </tbody>
            </table>

            {/* Beschäftigung */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={3} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Beschäftigung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Eintrittsdatum<br/>{user?.startDate ? new Date(user.startDate).toLocaleDateString('de-DE') : ''}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Ersteintrittsdatum<br/>{user?.startDate ? new Date(user.startDate).toLocaleDateString('de-DE') : ''}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Beschäftigungsbetrieb<br/>Hans im Club</td>
                </tr>
                <tr>
                   <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Berufsbezeichnung<br/>Servicekraft</td>
                   <td colSpan={2} style={{ border: '1px solid #000', padding: '5px' }}>Ausgeübte Tätigkeit<br/>Barkraft / Service</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    <strong>Höchster Schulabschluss</strong><br/>
                    [ {taxData.schoolDegree === 'kein' ? 'X' : ' '} ] ohne Schulabschluss<br/>
                    [ {taxData.schoolDegree === 'haupt' ? 'X' : ' '} ] Haupt/Volksschule<br/>
                    [ {taxData.schoolDegree === 'reife' ? 'X' : ' '} ] Mittlere Reife<br/>
                    [ {taxData.schoolDegree === 'abitur' ? 'X' : ' '} ] Abitur/Fachabi
                  </td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    <strong>Höchste Berufsausbildung</strong><br/>
                    [ {taxData.vocationalTraining === 'keine' ? 'X' : ' '} ] ohne Ausbildung<br/>
                    [ {taxData.vocationalTraining === 'anerkannt' ? 'X' : ' '} ] Anerkannt<br/>
                    [ {taxData.vocationalTraining === 'meister' ? 'X' : ' '} ] Meister/Techn.<br/>
                    [ {taxData.vocationalTraining === 'bachelor' ? 'X' : ' '} ] Bachelor<br/>
                    [ {taxData.vocationalTraining === 'master' ? 'X' : ' '} ] Master/Dipl.<br/>
                    [ {taxData.vocationalTraining === 'promotion' ? 'X' : ' '} ] Promotion
                  </td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    Wöchentl. Arbeitszeit: max 10h<br/>
                    Urlaubsanspruch: 24 Tage / Jahr
                  </td>
                </tr>
                <tr>
                   <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Kostenstelle / Abt.-Nummer<br/>Serviceteam 01</td>
                   <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Personengruppe<br/>109</td>
                   <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Im Baugewerbe beschäftigt seit<br/>-</td>
                </tr>
              </tbody>
            </table>

            {/* Status bei Beginn */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Status bei Beginn der Beschäftigung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                   Aktueller Status: <strong>{taxData.statusAtStart}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Steuer */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={3} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Steuer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Identifikationsnr.<br/>{taxData.taxId}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Finanzamt-Nr.<br/>{taxData.taxOfficeNumber || '-'}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Kinderfreibeträge<br/>{taxData.children}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Steuerklasse/Faktor<br/>{taxData.taxClass}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Konfession<br/>{taxData.confession}</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Pauschalisierung<br/>[ X ] 2% &nbsp; [ ] 20%</td>
                </tr>
              </tbody>
            </table>

            {/* Sozialversicherung */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={2} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Sozialversicherung</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ width: '50%', border: '1px solid #000', padding: '5px' }}>
                    Krankenversicherung:<br/>
                    [ {taxData.healthInsuranceType === 'Gesetzlich' ? 'X' : ' '} ] Gesetzlich &nbsp; [ {taxData.healthInsuranceType === 'Privat' ? 'X' : ' '} ] Privat
                  </td>
                  <td style={{ width: '50%', border: '1px solid #000', padding: '5px' }}>
                    Name Krankenkasse:<br/>
                    {taxData.healthInsurance}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '5px' }}>
                    [ {taxData.pensionExemption === 'on' ? 'X' : ' '} ] <strong>Antrag auf Befreiung von der Versicherungspflicht in der Rentenversicherung wurde gestellt.</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Weitere Beschäftigungen */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Üben Sie weitere Beschäftigungen aus?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    [ {taxData.otherJobs === 'ja' ? 'X' : ' '} ] ja &nbsp; [ {taxData.otherJobs === 'nein' ? 'X' : ' '} ] nein<br/>
                    {taxData.otherJobs === 'ja' && <p style={{ marginTop: '5px' }}>Details: {taxData.otherJobsDetails}</p>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bea & Abschluss */}
            <p style={{ fontSize: '10px', marginBottom: '10px' }}>
              [ {taxData.beaContradiction === 'on' ? 'X' : ' '} ] Ich widerspreche der elektronischen Übermittlung von Arbeitsbescheinigungen (Bea).
            </p>
            
            <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
              Erklärung des Arbeitnehmers: Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <div style={{ width: '45%' }}>
                <div style={{ borderBottom: '1px solid #000', height: '20px' }}>{taxDataProgress ? new Date(taxDataProgress.updatedAt).toLocaleDateString('de-DE') : ''}</div>
                <p style={{ fontSize: '9px' }}>Datum</p>
              </div>
              <div style={{ width: '45%' }}>
                <div style={{ borderBottom: '1px solid #000', height: '20px' }}>Digital signiert im Onboarding-Portal</div>
                <p style={{ fontSize: '9px' }}>Unterschrift Arbeitnehmer</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', width: '45%' }}>
                <div style={{ borderBottom: '1px solid #000', height: '20px' }}></div>
                <p style={{ fontSize: '9px' }}>Unterschrift Arbeitgeber</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.missingContract} style={{ marginBottom: '3rem' }}>
          <p>Der Personalfragebogen wurde noch nicht vollständig ausgefüllt.</p>
        </div>
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
