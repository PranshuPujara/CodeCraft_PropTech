export type Property = {
  id: string
  title: string
  location: string
  rent: number
  deposit: number
  brokerage: number
  furnishing: "Fully Furnished" | "Semi Furnished" | "Unfurnished"
  amenities: string[]
  bedrooms: number
  description: string
  images?: string[] // Mock extra field for better UI
}

export type CostItem = {
  amount: number
  isEstimated: boolean
}

export type CostBreakdown = {
  id: string
  propertyId: string
  maintenance: CostItem
  electricity: CostItem
  water: CostItem
  internet: CostItem
  transport: CostItem
  otherRecurring: CostItem
  estimatedMonthlyCost: number
  initialMoveInCost: number
}

export type SavedProperty = {
  id: string
  userId: string
  propertyId: string
  isShortlisted: boolean
}

export type AgreementClauseFlag = {
  clause: string
  reason: string
}

export type ExtractedFields = {
  rent: number | null
  deposit: number | null
  leaseDuration: string | null
  lockInPeriod: string | null
  noticePeriod: string | null
  rentEscalation: string | null
  maintenanceResponsibility: string | null
  utilityResponsibility: string | null
  penalties: string | null
  terminationConditions: string | null
}

export type Agreement = {
  id: string
  userId: string
  propertyId: string | null
  fileName: string
  uploadedAt: string
  extractedFields: ExtractedFields
  summary: string
  flaggedClauses: AgreementClauseFlag[]
}

export type RoommateProfile = {
  id: string
  userId: string
  budget: number
  sleepSchedule: string
  workSchedule: string
  cleanliness: string
  noiseTolerance: string
  guests: string
  smoking: string
  foodPreferences: string
  pets: string
  socialPreferences: string
}

export type CompatibilityResult = {
  id: string
  profileAId: string
  profileBId: string
  commonPreferences: string[]
  potentialConflicts: string[]
  explanation: string
  score: number
}

export type ChatMessage = {
  id: string
  userId: string
  role: "user" | "assistant"
  content: string
  contextRefs?: any
}
