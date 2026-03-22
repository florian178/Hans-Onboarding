"use client"

import { usePathname } from "next/navigation"
import { Stepper, Step } from "./ui/Stepper"

const STEPS: Step[] = [
  { id: "personal-data", title: "1. Persönliche Daten", description: "Stammdatenblatt ausfüllen" },
  { id: "contract", title: "2. Arbeitsvertrag", description: "Herunterladen und unterschrieben hochladen" },
  { id: "instructions", title: "3. Belehrungen", description: "Richtlinien lesen & bestätigen" },
  { id: "video", title: "4. Einweisungsvideo", description: "Sicherheits- und Ablaufvideo ansehen" }
]

export function OnboardingStepper() {
  const pathname = usePathname()
  const currentIndex = Math.max(0, STEPS.findIndex(s => pathname.includes(s.id)))

  return <Stepper steps={STEPS} currentStepIndex={currentIndex} />
}
