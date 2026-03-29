import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PrintButtonClient as PrintButton } from "@/components/ui/PrintButtonClient"
import styles from "../../admin/contracts/[userId]/page.module.css"

export default async function TaxFormPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { onboardingStatus: true }
  })

  if (!user) redirect("/login")

  const steps = await prisma.stepProgress.findMany({
    where: { userId },
  })

  const personalDataStep = steps.find(s => s.stepId === 'personal-data' && s.completed)
  const taxDataProgress = steps.find(s => s.stepId === 'tax-data' && s.completed)

  if (!taxDataProgress) {
    redirect("/dashboard")
  }

  let personalData = null
  if (personalDataStep?.data) {
    try {
      personalData = JSON.parse(personalDataStep.data)
    } catch {
      // ignore
    }
  }

  let taxData = null
  if (taxDataProgress.data) {
    try {
      taxData = JSON.parse(taxDataProgress.data)
    } catch {
      // ignore
    }
  }

  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  const addressLine = personalData ? `${personalData.address}, ${personalData.zipCode} ${personalData.city}` : "Adresse"

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <a href="/dashboard" className={styles.backLink}>← Zurück zum Dashboard</a>
      </div>

      <div className={styles.contractHeader}>
        <h2>Dein Personalfragebogen (Vorlage Corinna Czech)</h2>
        <PrintButton 
          className={styles.printBtn} 
          elementId="tax-questionnaire" 
          filename={`Personalfragebogen_Corinna_Czech_${name.replace(/\s/g, '_')}.pdf`}
          label="Als PDF speichern"
        />
      </div>

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
                  <td style={{ width: '25%', border: '1px solid #000', padding: '5px' }}>Familienname<br/>{taxData?.maidenName ? `(geb. ${taxData.maidenName})` : ''}</td>
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
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.birthDate ? new Date(taxData.birthDate).toLocaleDateString('de-DE') : ''}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Geschlecht</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    [ {taxData?.gender === 'männlich' ? 'X' : ' '} ] männlich &nbsp; [ {taxData?.gender === 'weiblich' ? 'X' : ' '} ] weiblich
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Versicherungsnummer<br/><span style={{ fontSize: '9px' }}>gem. Sozialvers.-Ausweis</span></td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.svNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Familienstand</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.maritalStatus}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Geburtsort, -land</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.birthPlace}</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>Schwerbehindert</td>
                  <td style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#eeeeee' }}>
                    [ {taxData?.disabled === 'ja' ? 'X' : ' '} ] ja &nbsp; [ {taxData?.disabled === 'nein' ? 'X' : ' '} ] nein
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Staatsangehörigkeit</td>
                  <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.nationality}</td>
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
                    [ {taxData?.schoolDegree === 'kein' ? 'X' : ' '} ] ohne Schulabschluss<br/>
                    [ {taxData?.schoolDegree === 'haupt' ? 'X' : ' '} ] Haupt/Volksschule<br/>
                    [ {taxData?.schoolDegree === 'reife' ? 'X' : ' '} ] Mittlere Reife<br/>
                    [ {taxData?.schoolDegree === 'abitur' ? 'X' : ' '} ] Abitur/Fachabi
                  </td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>
                    <strong>Höchste Berufsausbildung</strong><br/>
                    [ {taxData?.vocationalTraining === 'keine' ? 'X' : ' '} ] ohne Ausbildung<br/>
                    [ {taxData?.vocationalTraining === 'anerkannt' ? 'X' : ' '} ] Anerkannt<br/>
                    [ {taxData?.vocationalTraining === 'meister' ? 'X' : ' '} ] Meister/Techn.<br/>
                    [ {taxData?.vocationalTraining === 'bachelor' ? 'X' : ' '} ] Bachelor<br/>
                    [ {taxData?.vocationalTraining === 'master' ? 'X' : ' '} ] Master/Dipl.<br/>
                    [ {taxData?.vocationalTraining === 'promotion' ? 'X' : ' '} ] Promotion
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

            {/* Steuer */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
              <thead>
                <tr>
                  <th colSpan={3} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Steuer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Identifikationsnr.<br/>{taxData?.taxId}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Finanzamt-Nr.<br/>{taxData?.taxOfficeNumber || '-'}</td>
                  <td style={{ width: '33%', border: '1px solid #000', padding: '5px' }}>Kinderfreibeträge<br/>{taxData?.children}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Steuerklasse/Faktor<br/>{taxData?.taxClass}</td>
                  <td style={{ border: '1px solid #000', padding: '5px' }}>Konfession<br/>{taxData?.confession}</td>
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
                    [ {taxData?.healthInsuranceType === 'Gesetzlich' ? 'X' : ' '} ] Gesetzlich &nbsp; [ {taxData?.healthInsuranceType === 'Privat' ? 'X' : ' '} ] Privat
                  </td>
                  <td style={{ width: '50%', border: '1px solid #000', padding: '5px' }}>
                    Name Krankenkasse:<br/>
                    {taxData?.healthInsurance}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '5px' }}>
                    [ {taxData?.pensionExemption === 'on' ? 'X' : ' '} ] <strong>Antrag auf Befreiung von der Versicherungspflicht in der Rentenversicherung wurde gestellt.</strong>
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
                    [ {taxData?.otherJobs === 'ja' ? 'X' : ' '} ] ja &nbsp; [ {taxData?.otherJobs === 'nein' ? 'X' : ' '} ] nein<br/>
                    {taxData?.otherJobs === 'ja' && <p style={{ marginTop: '5px' }}>Details: {taxData?.otherJobsDetails}</p>}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bea & Abschluss */}
            <p style={{ fontSize: '10px', marginBottom: '10px' }}>
              [ {taxData?.beaContradiction === 'on' ? 'X' : ' '} ] Ich widerspreche der elektronischen Übermittlung von Arbeitsbescheinigungen (Bea).
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
    </div>
  )
}
