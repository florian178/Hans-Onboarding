import React from "react"
import styles from "./RVBefreiungPreview.module.css"

interface RVBefreiungData {
  firstName: string
  lastName: string
  svNumber: string
  signDate?: string | Date | null
  startDate?: string | Date | null
  signatureUrl?: string | null
  employerName?: string
}

export function RVBefreiungPreview({ 
  firstName, 
  lastName, 
  svNumber, 
  signDate, 
  startDate, 
  signatureUrl,
  employerName = "HS Event GmbH" 
}: RVBefreiungData) {
  
  const formattedSignDate = signDate ? new Date(signDate).toLocaleDateString('de-DE') : ''
  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('de-DE') : ''
  const todayDate = new Date().toLocaleDateString('de-DE')

  const renderBoxes = (value: string, count: number) => {
    const chars = (value || "").replace(/\s/g, '').split('')
    const boxes = []
    for (let i = 0; i < count; i++) {
        boxes.push(
            <div key={i} className={styles.box}>
                {chars[i] || ""}
            </div>
        )
    }
    return boxes
  }

  const renderDateBoxes = (dateStr: string) => {
    // Expects DD.MM.YYYY
    const parts = (dateStr || "").split('.')
    const day = (parts[0] || "").padStart(2, ' ').split('')
    const month = (parts[1] || "").padStart(2, ' ').split('')
    const year = (parts[2] || "").padStart(4, ' ').split('')
    
    return (
        <div className={styles.dateBoxesWrapper}>
            <div className={styles.datePart}>
                <div className={styles.box}>{day[0] !== ' ' ? day[0] : ''}</div>
                <div className={styles.box}>{day[1] !== ' ' ? day[1] : ''}</div>
                <div className={styles.dateLabel}>T&nbsp;&nbsp;&nbsp;&nbsp;T</div>
            </div>
            <div className={styles.datePart}>
                <div className={styles.box}>{month[0] !== ' ' ? month[0] : ''}</div>
                <div className={styles.box}>{month[1] !== ' ' ? month[1] : ''}</div>
                <div className={styles.dateLabel}>M&nbsp;&nbsp;&nbsp;&nbsp;M</div>
            </div>
            <div className={styles.datePart}>
                <div className={styles.box}>{year[0] !== ' ' ? year[0] : ''}</div>
                <div className={styles.box}>{year[1] !== ' ' ? year[1] : ''}</div>
                <div className={styles.box}>{year[2] !== ' ' ? year[2] : ''}</div>
                <div className={styles.box}>{year[3] !== ' ' ? year[3] : ''}</div>
                <div className={styles.dateLabel}>J&nbsp;&nbsp;&nbsp;&nbsp;J&nbsp;&nbsp;&nbsp;&nbsp;J&nbsp;&nbsp;&nbsp;&nbsp;J</div>
            </div>
        </div>
    )
  }

  return (
    <div className={styles.documentWrapper} style={{ backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif' }}>
        <div className={styles.topHeaderRed}></div>
        <div className={styles.topHeaderOrange}></div>
        
        <div className={styles.content}>
            <h1 className={styles.title}>
                Antrag auf Befreiung von der Rentenversicherungspflicht bei einer geringfügig entlohnten Beschäftigung nach § 6 Absatz 1b Sozialgesetzbuch – Sechstes Buch – (SGB VI)
            </h1>

            <div className={styles.sectionTitle}>Arbeitnehmer:</div>

            <div className={styles.row}>
                <div className={styles.label}>Name:</div>
                <div className={styles.underlineField}>{lastName}</div>
            </div>

            <div className={styles.row}>
                <div className={styles.label}>Vorname:</div>
                <div className={styles.underlineField}>{firstName}</div>
            </div>

            <div className={styles.rowWrapper}>
                <div className={styles.labelWide}>Rentenversicherungsnummer:</div>
                <div className={styles.boxesContainer}>
                    {renderBoxes(svNumber, 12)}
                </div>
            </div>

            <p className={styles.paragraph}>
                Hiermit beantrage ich die Befreiung von der Versicherungspflicht in der Rentenversicherung im Rahmen meiner geringfügig entlohnten Beschäftigung und verzichte damit auf den Erwerb von Pflichtbeitragszeiten. Ich habe die Hinweise auf dem „Merkblatt über die möglichen Folgen einer Befreiung von der Rentenversicherungspflicht“ zur Kenntnis genommen.
            </p>

            <p className={styles.paragraph}>
                Mir ist bekannt, dass der Befreiungsantrag für alle von mir zeitgleich ausgeübten geringfügig entlohnten Beschäftigungen gilt und für die Dauer der Beschäftigungen bindend ist; eine Rücknahme ist nicht möglich. Ich verpflichte mich, alle weiteren Arbeitgeber, bei denen ich eine geringfügig entlohnte Beschäftigung ausübe, über diesen Befreiungsantrag zu informieren.
            </p>

            <div className={styles.signatureRow}>
                <div className={styles.sigHalf}>
                    <div className={styles.underline}>{formattedSignDate ? `Digital signiert am ${formattedSignDate}` : ''}</div>
                    <div className={styles.subtext}>(Ort, Datum)</div>
                </div>
                <div className={styles.sigHalf}>
                    <div className={styles.underlineSig}>
                        {signatureUrl && <img src={signatureUrl} alt="Unterschrift" className={styles.signatureImg} />}
                    </div>
                    <div className={styles.subtext}>(Unterschrift des Arbeitnehmers bzw.<br/>bei Minderjährigen Unterschrift des gesetzlichen Vertreters)</div>
                </div>
            </div>

            <div className={styles.sectionTitle} style={{ marginTop: '40px' }}>Arbeitgeber:</div>

            <div className={styles.row}>
                <div className={styles.label}>Name:</div>
                <div className={styles.underlineField}>{employerName}</div>
            </div>

            <div className={styles.rowWrapper}>
                <div className={styles.labelLong}>Betriebsnummer:</div>
                <div className={styles.boxesContainer}>
                    {renderBoxes('', 8)}
                </div>
            </div>

            <div className={styles.rowWrapper}>
                <div className={styles.labelLong}>Der Befreiungsantrag ist am</div>
                {renderDateBoxes(formattedSignDate)}
                <div style={{ marginLeft: '10px' }}>bei mir eingegangen.</div>
            </div>

            <div className={styles.rowWrapper}>
                <div className={styles.labelLong}>Die Befreiung wirkt ab dem</div>
                {renderDateBoxes(formattedStartDate)}
                <div style={{ marginLeft: '10px' }}>.</div>
            </div>

            <div className={styles.signatureRow} style={{ marginTop: '20px' }}>
                <div className={styles.sigHalf}>
                    <div className={styles.underline}>Dresden, {todayDate}</div>
                    <div className={styles.subtext}>(Ort, Datum)</div>
                </div>
                <div className={styles.sigHalf}>
                    <div className={styles.underlineSig}>
                        {/* Employer Signature Placeholder */}
                        <div className={styles.employerSigText}>{employerName}</div>
                    </div>
                    <div className={styles.subtext}>(Unterschrift des Arbeitgebers)</div>
                </div>
            </div>

            <div className={styles.employerNote}>
                <strong>Hinweis für den Arbeitgeber:</strong><br/>
                Der Befreiungsantrag ist nach § 8 Absatz 2 Nr. 4a Beitragsverfahrensverordnung (BVV) zu den Entgeltunterlagen zu nehmen und nicht an die Minijob-Zentrale zu senden.
            </div>
        </div>
    </div>
  )
}
