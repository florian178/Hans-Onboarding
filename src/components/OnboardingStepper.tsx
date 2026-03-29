"use client"

import { usePathname } from "next/navigation"
import { Stepper, Step } from "./ui/Stepper"

const STEPS: Step[] = [
  { id: "personal-data", title: "1. Persönliche Daten", description: "Allgemeine Stammdaten" },
  { id: "tax-data", title: "2. Steuerliche Angaben", description: "Bogen für Steuerberater" },
  { id: "contract", title: "3. Arbeitsvertrag", description: "Digitale Unterzeichnung" },
  { id: "instructions", title: "4. Belehrungen", description: "Richtlinien lesen & bestätigen" },
  { id: "video", title: "5. Einweisungsvideo", description: "Sicherheits- und Ablaufvideo ansehen" }
]

export function OnboardingStepper() {
  const pathname = usePathname()
  const currentIndex = Math.max(0, STEPS.findIndex(s => pathname.includes(s.id)))

  return <Stepper steps={STEPS} currentStepIndex={currentIndex} />
}
