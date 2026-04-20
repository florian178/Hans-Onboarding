export function calculateTotalHours(startTime: string, endTime: string, breakMinutes: number): number {
  if (!startTime || !endTime) return 0
  
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0
  
  let startTotalMins = startH * 60 + startM
  let endTotalMins = endH * 60 + endM
  
  // Handle cross-midnight by adding 24 hours to end time
  if (endTotalMins < startTotalMins) {
    endTotalMins += 24 * 60
  }
  
  const totalMins = endTotalMins - startTotalMins - breakMinutes
  
  return parseFloat(Math.max(0, totalMins / 60).toFixed(2))
}

export function validateTimesheet(totalHours: number, breakMinutes: number) {
  const warnings: string[] = []
  const errors: string[] = []
  
  if (totalHours > 9 && breakMinutes < 45) {
    errors.push("Gesetzliche Vorgabe: Bei einer Arbeitszeit von über 9 Stunden sind mindestens 45 Minuten Pause Pflicht.")
  } else if (totalHours > 6 && breakMinutes < 30) {
    errors.push("Gesetzliche Vorgabe: Bei einer Arbeitszeit von über 6 Stunden sind mindestens 30 Minuten Pause Pflicht.")
  }

  if (totalHours > 10) {
    warnings.push("Achtung: Die tägliche Höchstarbeitszeit von 10 Stunden wurde überschritten.")
  }
  return { warnings, errors }
}
