"use client"

import dynamic from "next/dynamic"
import { Button } from "./Button"

export const PrintButtonClient = dynamic(
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
