import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import AvailabilityClient from "./AvailabilityClient"
import styles from "./availability.module.css"

export default async function AvailabilityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // Fetch published requests and their days
  const requests = await prisma.availabilityRequest.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { startDate: 'asc' },
    include: {
      days: {
        orderBy: { date: 'asc' }
      }
    }
  })

  // We pass this data to the client component to handle the interaction
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Verfügbarkeiten</h1>
          <p className={styles.subtitle}>Trage hier ein, an welchen Tagen du arbeiten kannst.</p>
        </div>
      </header>

      {requests.length === 0 ? (
        <div className={styles.emptyState}>
          Aktuell gibt es keine offenen Abfragen für Verfügbarkeiten.
        </div>
      ) : (
        <AvailabilityClient requests={requests} />
      )}
    </div>
  )
}
