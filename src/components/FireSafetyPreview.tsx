import React from 'react'

interface FireSafetyPreviewProps {
  employeeName: string
  signatureUrl?: string | null
  signatureDate?: string | Date | null
  employerName?: string
}

export function FireSafetyPreview({ 
  employeeName, 
  signatureUrl, 
  signatureDate,
  employerName = "Arbeitgeber HS Event GmbH vertreten durch Geschäftsführer Florian Herbst"
}: FireSafetyPreviewProps) {
  let formattedDate = ''
  if (signatureDate) {
    try {
      formattedDate = new Date(signatureDate).toLocaleDateString('de-DE')
    } catch {
      formattedDate = ''
    }
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      color: '#000',
      lineHeight: '1.4',
      fontSize: '12px',
      backgroundColor: '#fff',
      padding: '40px',
      margin: '0 auto',
      maxWidth: '794px', // A4 Width simulation for desktop preview
      width: '100%',
      boxSizing: 'border-box'
    }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>MITARBEITERBELEHRUNG BRANDSCHUTZ</h1>
        <p style={{ margin: 0, fontWeight: 'bold' }}>gemäß DIN 14096 – Teil B</p>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <p style={{ margin: 0 }}>Objekt: Hans im Club</p>
        <p style={{ margin: 0 }}>Adresse: Wallstraße 11, 01067 Dresden</p>
        <p style={{ margin: 0 }}>Betreiber: HS Event GmbH</p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>1. Allgemeines</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <p style={{ marginBottom: '15px' }}>
        Diese Belehrung dient der Unterweisung aller Mitarbeiter im sicheren Verhalten zur Verhütung von Bränden sowie im Verhalten im Brand- und Gefahrenfall.
      </p>
      <p style={{ marginBottom: '30px' }}>
        Jeder Mitarbeiter ist verpflichtet, diese Belehrung zu lesen, zu verstehen und die Inhalte im Arbeitsalltag umzusetzen.
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>2. Verhalten zur Brandverhütung</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 30px 0' }}>
        <li style={{ marginBottom: '4px' }}>- Im gesamten Gebäude gilt absolutes Rauchverbot</li>
        <li style={{ marginBottom: '4px' }}>- Flucht- und Rettungswege (Flure, Treppenhäuser) sind jederzeit freizuhalten</li>
        <li style={{ marginBottom: '4px' }}>- Brandschutztüren dürfen nicht verkeilt oder blockiert werden</li>
        <li style={{ marginBottom: '4px' }}>- Elektrische Geräte sind sachgemäß zu benutzen</li>
        <li style={{ marginBottom: '4px' }}>- Defekte Geräte sind sofort außer Betrieb zu nehmen und zu melden</li>
        <li style={{ marginBottom: '4px' }}>- Brennbare Materialien sind ordnungsgemäß zu lagern</li>
        <li style={{ marginBottom: '4px' }}>- Offenes Feuer ist untersagt</li>
      </ul>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>3. Verhalten im Brandfall</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <p style={{ marginBottom: '15px' }}>Bei Wahrnehmung von Rauch, Feuer oder Alarm ist unverzüglich zu handeln:</p>
      
      <ol style={{ paddingLeft: '20px', margin: '0 0 30px 0' }}>
        <li style={{ marginBottom: '4px' }}>Ruhe bewahren</li>
        <li style={{ marginBottom: '4px' }}>Alarm auslösen (Hausalarm betätigen)</li>
        <li style={{ marginBottom: '4px' }}>Feuerwehr verständigen (112)</li>
        <li style={{ marginBottom: '4px' }}>Evakuierung einleiten</li>
      </ol>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>4. Evakuierung</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 15px 0' }}>
        <li style={{ marginBottom: '4px' }}>- Gäste sind ruhig und geordnet zu den Notausgängen zu führen</li>
        <li style={{ marginBottom: '4px' }}>- Den Anweisungen der Sicherheitskräfte ist Folge zu leisten</li>
        <li style={{ marginBottom: '4px' }}>- Es dürfen keine Gegenstände (z. B. Garderobe) geholt werden</li>
        <li style={{ marginBottom: '4px' }}>- Fluchtwege sind konsequent zu nutzen und freizuhalten</li>
      </ul>

      <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Aufgabenverteilung:</p>
      
      <p style={{ margin: '0 0 5px 0' }}>Barpersonal:</p>
      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 15px 0' }}>
        <li style={{ marginBottom: '4px' }}>- Gäste aktiv zu den Ausgängen führen</li>
        <li style={{ marginBottom: '4px' }}>- Klare und laute Ansagen machen</li>
      </ul>

      <p style={{ margin: '0 0 5px 0' }}>Sicherheitsdienst:</p>
      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 30px 0' }}>
        <li style={{ marginBottom: '4px' }}>- Treppenhäuser sichern</li>
        <li style={{ marginBottom: '4px' }}>- Evakuierung koordinieren</li>
      </ul>

      {/* Page break may be necessary here for printing, but we will flow it continuously for now */}

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>5. Brandbekämpfung</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 15px 0' }}>
        <li style={{ marginBottom: '4px' }}>- Löschversuche nur bei kleinen Entstehungsbränden durchführen</li>
        <li style={{ marginBottom: '4px' }}>- Nur ohne Eigengefährdung handeln</li>
        <li style={{ marginBottom: '4px' }}>- Feuerlöscher erst am Einsatzort betriebsbereit machen</li>
        <li style={{ marginBottom: '4px' }}>- Fluchtweg stets freihalten</li>
      </ul>

      <p style={{ margin: '0 0 30px 0' }}>
        Grundsatz:<br/>
        Menschenrettung hat Vorrang vor Brandbekämpfung
      </p>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>6. Verhalten nach Arbeitsende</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <p style={{ marginBottom: '10px' }}>Nach Veranstaltungsende sind folgende Maßnahmen durchzuführen:</p>

      <p style={{ margin: '0 0 5px 0' }}>- Elektrische Geräte ausschalten, insbesondere:</p>
      <div style={{ marginLeft: '10px', marginBottom: '15px' }}>
        <p style={{ margin: 0 }}>Kühlschränke (sofern betrieblich möglich)</p>
        <p style={{ margin: 0 }}>Zapfanlagen</p>
        <p style={{ margin: 0 }}>Lichttechnik</p>
        <p style={{ margin: 0 }}>Tontechnik</p>
      </div>

      <p style={{ margin: '0 0 30px 0' }}>- Kontrolle der Arbeitsbereiche auf mögliche Gefahrenquellen</p>

      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>7. Meldepflicht</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <p style={{ marginBottom: '10px' }}>Alle sicherheitsrelevanten Mängel sind unverzüglich zu melden, insbesondere:</p>

      <ul style={{ listStyleType: 'none', padding: 0, margin: '0 0 30px 0' }}>
        <li style={{ marginBottom: '4px' }}>- blockierte Fluchtwege</li>
        <li style={{ marginBottom: '4px' }}>- defekte Beleuchtung</li>
        <li style={{ marginBottom: '4px' }}>- beschädigte Feuerlöscher</li>
        <li style={{ marginBottom: '4px' }}>- technische Defekte</li>
      </ul>


      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '20px 0 5px 0' }} />
      <h2 style={{ fontSize: '14px', margin: '0 0 5px 0', textTransform: 'uppercase' }}>8. Bestätigung</h2>
      <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '0 0 15px 0' }} />

      <p style={{ marginBottom: '30px' }}>
        Hiermit bestätige ich, dass ich die Mitarbeiterbelehrung zum Brandschutz gelesen und verstanden habe. Ich verpflichte mich, die Inhalte einzuhalten.
      </p>

      <table style={{ width: '100%', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '60px', paddingBottom: '10px' }}>Name:</td>
            <td style={{ borderBottom: '1px solid #000', paddingBottom: '10px' }}>{employeeName}</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '10px', paddingTop: '10px' }}>Datum:</td>
            <td style={{ borderBottom: '1px solid #000', paddingBottom: '10px', paddingTop: '10px' }}>{formattedDate}</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', alignItems: 'flex-end', paddingBottom: '40px' }}>
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
                Unterschrift Arbeitnehmer
              </div>
            )}
          </div>
          <p style={{ fontSize: '10px', marginTop: '2px' }}>Unterschrift Arbeitnehmer</p>
        </div>

        <div style={{ width: '45%' }}>
          <div style={{ borderBottom: '1px solid #000', height: '60px', position: 'relative' }}>
             <div style={{ position: 'absolute', bottom: '5px', left: 0, fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', fontStyle: 'italic', transform: 'rotate(-2deg)', width: '200px' }}>
               {employerName}
             </div>
          </div>
          <p style={{ fontSize: '10px', marginTop: '2px' }}>Unterschrift Arbeitgeber</p>
        </div>
      </div>

    </div>
  )
}
