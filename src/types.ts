export type MeterRole = 'it_load' | 'cooling'

export interface TimePoint {
  timestamp: string
  itKw: number
  coolingKw: number
  totalKw: number
  pueProxy: number
  coolingRatio: number
  costIndex: number
}

export interface DailyPoint {
  date: string
  itEnergyKwh: number
  coolingEnergyKwh: number
  totalEnergyKwh: number
  costIndex: number
}

export interface DeviceSummary {
  device: string
  role: MeterRole
  averageKw: number
  peakKw: number
  estimatedEnergyKwh: number
  observedHours: number
}

export interface DashboardData {
  metadata: {
    facilityName: string
    sourceDataset: string
    sourceUrl: string
    doiUrl: string
    sourceFile: string
    generatedAt: string
    sampleTariffPerKwh: number
    costUnit: string
    powerUnit: string
    timeZoneNote: string
    pueNote: string
  }
  kpis: {
    averageItKw: number
    averageCoolingKw: number
    averagePueProxy: number
    totalEnergyKwh: number
    costIndex: number
    peakTotalKw: number
    peakTimestamp: string
    coolingShare: number
  }
  timeSeries: TimePoint[]
  daily: DailyPoint[]
  devices: DeviceSummary[]
  dataQuality: {
    rawRows: number
    recognizedRows: number
    invalidRows: number
    zeroPowerRows: number
    deviceCount: number
    hourlyPoints: number
    coverageStart: string
    coverageEnd: string
    completeness: number
  }
}
