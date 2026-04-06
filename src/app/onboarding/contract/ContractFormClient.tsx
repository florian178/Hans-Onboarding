"use client"

import dynamic from "next/dynamic"

const ContractForm = dynamic(() => import("./ContractForm").then(mod => mod.ContractForm), {
  ssr: false,
  loading: () => <p>Vertrag wird geladen...</p>
})

export default function ContractFormClient({ personalData, startDate, hourlyWage }: { personalData: { firstName: string, lastName: string, address: string, zipCode: string, city: string, iban?: string } | null, startDate?: Date | null, hourlyWage: number }) {
  return <ContractForm personalData={personalData} startDate={startDate} hourlyWage={hourlyWage} />
}
