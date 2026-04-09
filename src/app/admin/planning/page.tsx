"use client"
import React, { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import RequestsClient from "./RequestsClient"
import ResponsesClient from "./ResponsesClient"
import dynamic from "next/dynamic"

const DayPlanBuilder = dynamic(() => import("./DayPlanBuilder"), { ssr: false })

import styles from "./planning.module.css"

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "RESPONSES" | "SCHEDULER">("REQUESTS")
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/planning/requests")
      const data = await res.json()
      setRequests(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerArea}>
        <h1 className={styles.pageTitle}>Verfügbarkeiten & Personalplanung</h1>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "REQUESTS" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("REQUESTS")}
          >
            Abfragen {requests.length > 0 && `(${requests.length})`}
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "RESPONSES" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("RESPONSES")}
          >
            Auswertung
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "SCHEDULER" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("SCHEDULER")}
          >
            Einsatzplanung
          </button>
        </div>
      </div>

      <div className={styles.contentArea}>
        {isLoading ? (
          <p>Lade Planungsdaten...</p>
        ) : (
          <>
            {activeTab === "REQUESTS" && <RequestsClient requests={requests} onRefresh={fetchRequests} />}
            {activeTab === "RESPONSES" && <ResponsesClient requests={requests} />}
            {activeTab === "SCHEDULER" && <DayPlanBuilder requests={requests} />}
          </>
        )}
      </div>
    </div>
  )
}
