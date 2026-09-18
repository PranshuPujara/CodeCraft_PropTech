import { Property, CostBreakdown, SavedProperty, Agreement, CompatibilityResult, RoommateProfile } from "./api-types"

const mockProperties: Property[] = [
  {
    id: "prop-1",
    title: "Modern 2BHK in Koramangala",
    location: "Koramangala, Bangalore",
    rent: 35000,
    deposit: 150000,
    brokerage: 35000,
    furnishing: "Fully Furnished",
    amenities: ["Gym", "Pool", "Power Backup", "Security"],
    bedrooms: 2,
    description: "A well-ventilated, spacious 2BHK in the heart of Koramangala. Close to tech parks and cafes.",
  },
  {
    id: "prop-2",
    title: "Cozy 1BHK in Indiranagar",
    location: "Indiranagar, Bangalore",
    rent: 25000,
    deposit: 100000,
    brokerage: 12500,
    furnishing: "Semi Furnished",
    amenities: ["Power Backup", "Security"],
    bedrooms: 1,
    description: "Perfect for a single professional. Quiet neighborhood, walking distance to the metro.",
  },
  {
    id: "prop-3",
    title: "Spacious 3BHK in HSR Layout",
    location: "HSR Layout, Bangalore",
    rent: 55000,
    deposit: 200000,
    brokerage: 55000,
    furnishing: "Unfurnished",
    amenities: ["Gym", "Clubhouse", "Tennis Court", "Power Backup"],
    bedrooms: 3,
    description: "Luxury apartment in a gated community with excellent amenities. Great for families or sharing.",
  }
]

const mockCosts: Record<string, CostBreakdown> = {
  "prop-1": {
    id: "cost-1",
    propertyId: "prop-1",
    maintenance: { amount: 3500, isEstimated: false },
    electricity: { amount: 1500, isEstimated: true },
    water: { amount: 500, isEstimated: true },
    internet: { amount: 1000, isEstimated: true },
    transport: { amount: 2000, isEstimated: true },
    otherRecurring: { amount: 1000, isEstimated: true },
    estimatedMonthlyCost: 44500,
    initialMoveInCost: 220000
  },
  "prop-2": {
    id: "cost-2",
    propertyId: "prop-2",
    maintenance: { amount: 1500, isEstimated: false },
    electricity: { amount: 1000, isEstimated: true },
    water: { amount: 300, isEstimated: true },
    internet: { amount: 1000, isEstimated: true },
    transport: { amount: 3000, isEstimated: true },
    otherRecurring: { amount: 500, isEstimated: true },
    estimatedMonthlyCost: 32300,
    initialMoveInCost: 137500
  },
  "prop-3": {
    id: "cost-3",
    propertyId: "prop-3",
    maintenance: { amount: 5000, isEstimated: false },
    electricity: { amount: 2500, isEstimated: true },
    water: { amount: 800, isEstimated: true },
    internet: { amount: 1500, isEstimated: true },
    transport: { amount: 2500, isEstimated: true },
    otherRecurring: { amount: 1500, isEstimated: true },
    estimatedMonthlyCost: 68800,
    initialMoveInCost: 310000
  }
}

// In-memory state for saved properties
let mockSavedProperties: SavedProperty[] = [
  { id: "save-1", userId: "demo-user", propertyId: "prop-1", isShortlisted: true },
  { id: "save-2", userId: "demo-user", propertyId: "prop-2", isShortlisted: false }
]

// Mock API Fetchers with artificial delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

export const mockApi = {
  async getProperties(): Promise<Property[]> {
    await delay(600)
    return mockProperties
  },
  async getProperty(id: string): Promise<Property | undefined> {
    await delay(400)
    return mockProperties.find(p => p.id === id)
  },
  async getPropertyCost(id: string): Promise<CostBreakdown | undefined> {
    await delay(400)
    return mockCosts[id]
  },
  async getSavedProperties(): Promise<SavedProperty[]> {
    await delay(300)
    return mockSavedProperties
  },
  async toggleSavedProperty(propertyId: string, isShortlisted: boolean = false): Promise<SavedProperty[]> {
    await delay(300)
    const existingIndex = mockSavedProperties.findIndex(s => s.propertyId === propertyId)
    if (existingIndex >= 0) {
      if (mockSavedProperties[existingIndex].isShortlisted === isShortlisted) {
        // Toggle off completely
        mockSavedProperties = mockSavedProperties.filter(s => s.propertyId !== propertyId)
      } else {
        mockSavedProperties[existingIndex].isShortlisted = isShortlisted
      }
    } else {
      mockSavedProperties.push({
        id: `save-${Date.now()}`,
        userId: "demo-user",
        propertyId,
        isShortlisted
      })
    }
    return mockSavedProperties
  }
}
