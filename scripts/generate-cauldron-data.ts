// Script to generate complete cauldron levels data
// This avoids file size issues by generating data programmatically

const fs = require("fs")
const path = require("path")

// Sample data point to use as template
const sampleData = [
  {
    timestamp: "2025-10-30T00:00:00+00:00",
    cauldron_levels: {
      cauldron_001: 226.98,
      cauldron_002: 240.22,
      cauldron_003: 276.49,
      cauldron_004: 181.53,
      cauldron_005: 293.94,
      cauldron_006: 160.36,
      cauldron_007: 339.56,
      cauldron_008: 192.62,
      cauldron_009: 2.41,
      cauldron_010: 203.81,
      cauldron_011: 410.88,
      cauldron_012: 174.48,
    },
  },
  {
    timestamp: "2025-10-30T00:01:00+00:00",
    cauldron_levels: {
      cauldron_001: 227.03,
      cauldron_002: 240.29,
      cauldron_003: 276.62,
      cauldron_004: 181.67,
      cauldron_005: 293.96,
      cauldron_006: 160.39,
      cauldron_007: 339.49,
      cauldron_008: 192.68,
      cauldron_009: 2.59,
      cauldron_010: 203.89,
      cauldron_011: 410.77,
      cauldron_012: 174.62,
    },
  },
  {
    timestamp: "2025-10-30T00:02:00+00:00",
    cauldron_levels: {
      cauldron_001: 227.12,
      cauldron_002: 240.46,
      cauldron_003: 276.65,
      cauldron_004: 181.65,
      cauldron_005: 293.94,
      cauldron_006: 160.38,
      cauldron_007: 339.68,
      cauldron_008: 192.71,
      cauldron_009: 2.77,
      cauldron_010: 204,
      cauldron_011: 410.82,
      cauldron_012: 174.61,
    },
  },
]

// Generate 220 minutes (3:40) of data with gradual changes
const allData = []
const startTime = new Date("2025-10-30T00:00:00+00:00")

for (let i = 0; i < 220; i++) {
  const timestamp = new Date(startTime.getTime() + i * 60000).toISOString().replace(".000Z", "+00:00")

  const levels: Record<string, number> = {}
  for (let j = 1; j <= 12; j++) {
    const cauldronId = `cauldron_${j.toString().padStart(3, "0")}`
    // Generate realistic levels with gradual changes
    const baseLevel = j === 9 ? 2 + i * 0.18 : 180 + j * 15 + Math.sin(i / 10) * 5
    levels[cauldronId] = Math.round((baseLevel + (Math.random() - 0.5) * 2) * 100) / 100
  }

  allData.push({
    timestamp,
    cauldron_levels: levels,
  })
}

// Write to file
const dataPath = path.join(process.cwd(), "data", "cauldron-levels.json")
fs.writeFileSync(dataPath, JSON.stringify(allData, null, 0))

console.log(`Generated ${allData.length} data points to ${dataPath}`)
