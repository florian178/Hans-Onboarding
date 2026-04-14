import React from 'react'

interface TaxFormPreviewProps {
  user: any
  personalData: any
  taxData: any
  signatureUrl?: string | null
  taxDataProgressDate?: string | Date | null
}

export function TaxFormPreview({ user, personalData, taxData, signatureUrl, taxDataProgressDate }: TaxFormPreviewProps) {
  const name = personalData ? `${personalData.firstName} ${personalData.lastName}` : "Mitarbeiter/-in"
  
  // Format the date if provided
  let formattedDate = ''
  if (taxDataProgressDate) {
    try {
      formattedDate = new Date(taxDataProgressDate).toLocaleDateString('de-DE')
    } catch {
      formattedDate = ''
    }
  }

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      color: '#000', 
      lineHeight: '1.2', 
      fontSize: '11px',
      backgroundColor: '#fff',
      padding: '40px',
      margin: '0 auto',
      maxWidth: '794px', // A4 Width simulation for desktop preview
      width: '100%',
      boxSizing: 'border-box'
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
            <td style={{ border: '1px solid #000', padding: '5px' }}>Familienname</td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.lastName}</td>
            <td style={{ border: '1px solid #000', padding: '5px' }}>Vorname</td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{personalData?.firstName}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '5px' }}>Geburtsname</td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.maidenName || '—'}</td>
            <td style={{ border: '1px solid #000', padding: '5px' }}>Geschlecht</td>
            <td style={{ border: '1px solid #000', padding: '5px' }}>
              [ {taxData?.gender === 'männlich' ? 'X' : ' '} ] männlich &nbsp; [ {taxData?.gender === 'weiblich' ? 'X' : ' '} ] weiblich
            </td>
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
            <td style={{ border: '1px solid #000', padding: '5px' }}>Familienstand</td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.maritalStatus}</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #000', padding: '5px' }}>Versicherungsnummer<br/><span style={{ fontSize: '9px' }}>gem. Sozialvers.-Ausweis</span></td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.svNumber}</td>
            <td style={{ border: '1px solid #000', padding: '5px' }}>Status bei Beginn</td>
            <td style={{ border: '1px solid #000', padding: '5px', verticalAlign: 'top' }}>{taxData?.statusAtStart}</td>
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
            <th colSpan={4} style={{ textAlign: 'left', padding: '5px', backgroundColor: '#f5f5f5', border: '1px solid #000', fontSize: '12px' }}>Üben Sie neben dieser Beschäftigung noch weitere Beschäftigungen aus oder beziehen Sie eine Rente?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} style={{ border: '1px solid #000', padding: '5px' }}>
              [ {taxData?.otherJobs === 'ja' ? 'X' : ' '} ] ja &nbsp; [ {taxData?.otherJobs === 'nein' ? 'X' : ' '} ] nein
            </td>
          </tr>
          {taxData?.otherJobs === 'ja' && (
            <>
              <tr>
                <td colSpan={4} style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#f9f9f9', fontWeight: 'bold', fontSize: '10px' }}>1. Weitere Beschäftigung</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px' }}>Arbeitgeber</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData?.otherJob1Employer || '—'}</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>Art</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData?.otherJob1Type || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '5px' }}>Monatsverdienst</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData?.otherJob1Income || '—'}</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>Zeitraum</td>
                <td style={{ border: '1px solid #000', padding: '5px' }}>
                  {taxData?.otherJob1Start ? new Date(taxData.otherJob1Start).toLocaleDateString('de-DE') : '—'}
                  {taxData?.otherJob1End ? ` bis ${new Date(taxData.otherJob1End).toLocaleDateString('de-DE')}` : ' (unbefristet)'}
                </td>
              </tr>
              {taxData?.otherJob2Employer && (
                <>
                  <tr>
                    <td colSpan={4} style={{ border: '1px solid #000', padding: '5px', backgroundColor: '#f9f9f9', fontWeight: 'bold', fontSize: '10px' }}>2. Weitere Beschäftigung</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Arbeitgeber</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData.otherJob2Employer}</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Art</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData?.otherJob2Type || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Monatsverdienst</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>{taxData?.otherJob2Income || '—'}</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>Zeitraum</td>
                    <td style={{ border: '1px solid #000', padding: '5px' }}>
                      {taxData?.otherJob2Start ? new Date(taxData.otherJob2Start).toLocaleDateString('de-DE') : '—'}
                      {taxData?.otherJob2End ? ` bis ${new Date(taxData.otherJob2End).toLocaleDateString('de-DE')}` : ' (unbefristet)'}
                    </td>
                  </tr>
                </>
              )}
              {taxData?.otherJobsDetails && (
                <tr>
                  <td colSpan={4} style={{ border: '1px solid #000', padding: '5px' }}>Anmerkungen: {taxData.otherJobsDetails}</td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
      
      <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
        Erklärung des Arbeitnehmers: Ich versichere, dass die vorstehenden Angaben der Wahrheit entsprechen.
      </p>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-end' }}>
        <div style={{ width: '45%' }}>
          <div style={{ borderBottom: '1px solid #000', height: '20px' }}>{formattedDate}</div>
          <p style={{ fontSize: '9px' }}>Datum</p>
        </div>
        <div style={{ width: '45%', position: 'relative' }}>
          <div style={{ borderBottom: '1px solid #000', height: '60px', position: 'relative' }}>
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={signatureUrl} 
                alt="Unterschrift Arbeitnehmer" 
                style={{ position: 'absolute', bottom: 0, left: 0, maxHeight: '80px', maxWidth: '100%', pointerEvents: 'none' }}
              />
            ) : (
              <div style={{ position: 'absolute', bottom: '2px', left: 0, color: '#999', fontSize: '10px' }}>
                Digital signiert im Onboarding-Portal
              </div>
            )}
          </div>
          <p style={{ fontSize: '9px', marginTop: '2px' }}>Unterschrift Arbeitnehmer</p>
        </div>
      </div>

      <div style={{ marginTop: '40px', width: '45%' }}>
          <div style={{ borderBottom: '1px solid #000', height: '60px', position: 'relative' }}>
             <div style={{ position: 'absolute', bottom: '5px', left: 0, fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic', transform: 'rotate(-2deg)', width: '200px' }}>
               HS Event GmbH vertreten durch Geschäftsführer Florian Herbst
             </div>
          </div>
          <p style={{ fontSize: '9px', marginTop: '2px' }}>Unterschrift Arbeitgeber</p>
      </div>
    </div>
  )
}
