"use client"

import dynamic from "next/dynamic"
import { Button } from "./Button"
import { FiLoader } from "react-icons/fi"

const DynamicSendToAdvisorButton = dynamic(
  () => import("./SendToAdvisorButton").then(mod => mod.SendToAdvisorButton),
  { 
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled>
        <FiLoader className="w-4 h-4 mr-2 animate-spin" />
        Lade E-Mail Funktion...
      </Button>
    )
  }
)

export function SendToAdvisorButtonClient(props: any) {
  return <DynamicSendToAdvisorButton {...props} />
}
