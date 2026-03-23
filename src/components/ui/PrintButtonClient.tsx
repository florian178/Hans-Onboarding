"use client"

import dynamic from "next/dynamic"
import { Button } from "./Button"

const DynamicPrintButton = dynamic(
  () => import("./PrintButton").then(mod => mod.PrintButton),
  { 
    ssr: false, 
    loading: () => (
      <Button variant="outline" disabled>
        Lade PDF-Generator...
      </Button>
    )
  }
)

export function PrintButtonClient(props: any) {
  return <DynamicPrintButton {...props} />
}
