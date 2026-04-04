export type TimesheetStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"

export interface TimesheetEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  breakMinutes: number
  totalHours: number
  status: TimesheetStatus
  note?: string | null
  hourlyWage?: number | null
  approvedBy?: string | null
  createdAt: Date
  updatedAt: Date
  user?: {
    name: string | null
    email: string | null
  }
}
