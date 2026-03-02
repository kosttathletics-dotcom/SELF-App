import { NCAA_DISCLAIMER } from '@/lib/ncaa'

export interface Benchmark {
    sport: string
    position: string
    division: 'FBS' | 'FCS' | 'D2/NAIA' | 'D3'
    height_min?: string
    weight_min?: number
    forty_yard?: number
    bench?: number
    squat?: number
    vertical?: number
    notes?: string
}

export const FOOTBALL_BENCHMARKS: Benchmark[] = [
    // FBS Power 5
    { sport: 'Football', position: 'QB', division: 'FBS', height_min: "6'3", weight_min: 215, forty_yard: 4.6 },
    { sport: 'Football', position: 'RB', division: 'FBS', height_min: "5'11", weight_min: 210, forty_yard: 4.5 },
    { sport: 'Football', position: 'WR', division: 'FBS', height_min: "6'2", weight_min: 185, forty_yard: 4.5 },
    { sport: 'Football', position: 'TE', division: 'FBS', height_min: "6'4", weight_min: 240, forty_yard: 4.7 },
    { sport: 'Football', position: 'OL', division: 'FBS', height_min: "6'5", weight_min: 280, forty_yard: 5.0 },
    { sport: 'Football', position: 'LB', division: 'FBS', height_min: "6'2", weight_min: 220, forty_yard: 4.6 },
    { sport: 'Football', position: 'DB', division: 'FBS', height_min: "6'0", weight_min: 195, forty_yard: 4.5 },
    { sport: 'Football', position: 'DL', division: 'FBS', height_min: "6'4", weight_min: 250, forty_yard: 4.8 },
    // FCS
    { sport: 'Football', position: 'QB', division: 'FCS', height_min: "6'2", weight_min: 205, forty_yard: 4.7 },
    { sport: 'Football', position: 'RB', division: 'FCS', height_min: "5'10", weight_min: 200, forty_yard: 4.6 },
    { sport: 'Football', position: 'WR', division: 'FCS', height_min: "6'1", weight_min: 180, forty_yard: 4.6 },
    { sport: 'Football', position: 'TE', division: 'FCS', height_min: "6'3", weight_min: 230, forty_yard: 4.8 },
    { sport: 'Football', position: 'OL', division: 'FCS', height_min: "6'4", weight_min: 265, forty_yard: 5.1 },
    { sport: 'Football', position: 'LB', division: 'FCS', height_min: "6'1", weight_min: 215, forty_yard: 4.7 },
    { sport: 'Football', position: 'DB', division: 'FCS', height_min: "5'11", weight_min: 185, forty_yard: 4.6 },
    { sport: 'Football', position: 'DL', division: 'FCS', height_min: "6'3", weight_min: 240, forty_yard: 4.9 },
    // D2 / NAIA
    { sport: 'Football', position: 'QB', division: 'D2/NAIA', height_min: "6'1", weight_min: 195, forty_yard: 4.8 },
    { sport: 'Football', position: 'RB', division: 'D2/NAIA', height_min: "5'10", weight_min: 195, forty_yard: 4.7 },
    { sport: 'Football', position: 'WR', division: 'D2/NAIA', height_min: "6'0", weight_min: 175, forty_yard: 4.7 },
    { sport: 'Football', position: 'TE', division: 'D2/NAIA', height_min: "6'2", weight_min: 220, forty_yard: 4.9 },
    { sport: 'Football', position: 'OL', division: 'D2/NAIA', height_min: "6'3", weight_min: 255, forty_yard: 5.2 },
    { sport: 'Football', position: 'LB', division: 'D2/NAIA', height_min: "6'0", weight_min: 205, forty_yard: 4.8 },
    { sport: 'Football', position: 'DB', division: 'D2/NAIA', height_min: "5'10", weight_min: 180, forty_yard: 4.7 },
    { sport: 'Football', position: 'DL', division: 'D2/NAIA', height_min: "6'2", weight_min: 230, forty_yard: 5.0 },
    // D3
    { sport: 'Football', position: 'QB', division: 'D3', height_min: "6'0", weight_min: 190, forty_yard: 4.9 },
    { sport: 'Football', position: 'RB', division: 'D3', height_min: "5'9", weight_min: 185, forty_yard: 4.8 },
    { sport: 'Football', position: 'WR', division: 'D3', height_min: "5'11", weight_min: 170, forty_yard: 4.8 },
    { sport: 'Football', position: 'TE', division: 'D3', height_min: "6'1", weight_min: 210, forty_yard: 5.0 },
    { sport: 'Football', position: 'OL', division: 'D3', height_min: "6'2", weight_min: 240, forty_yard: 5.3 },
    { sport: 'Football', position: 'LB', division: 'D3', height_min: "5'11", weight_min: 200, forty_yard: 4.9 },
    { sport: 'Football', position: 'DB', division: 'D3', height_min: "5'9", weight_min: 175, forty_yard: 4.8 },
    { sport: 'Football', position: 'DL', division: 'D3', height_min: "6'1", weight_min: 220, forty_yard: 5.1 },
]

export { NCAA_DISCLAIMER }

/**
 * Get benchmarks for a specific sport, position, and division
 */
export function getBenchmark(
    sport: string,
    position: string,
    division: Benchmark['division']
): Benchmark | undefined {
    return FOOTBALL_BENCHMARKS.find(
        (b) => b.sport === sport && b.position === position && b.division === division
    )
}

/**
 * Determine how an athlete's metric compares to a benchmark value
 * For 40-yard dash: lower is better
 */
export function getMetricStatus(
    athleteValue: number,
    benchmarkValue: number,
    lowerIsBetter = false
): 'green' | 'yellow' | 'red' {
    const ratio = lowerIsBetter
        ? benchmarkValue / athleteValue
        : athleteValue / benchmarkValue

    if (ratio >= 1.0) return 'green'
    if (ratio >= 0.9) return 'yellow'
    return 'red'
}

/**
 * Project the division fit based on athlete measurables
 */
export function projectDivisionFit(
    sport: string,
    position: string,
    athleteWeight: number,
    athleteFortyYard: number,
    coreGPA: number
): 'FBS' | 'FCS' | 'D2/NAIA' | 'D3' | 'Needs Development' {
    const divisions: Array<Benchmark['division']> = ['FBS', 'FCS', 'D2/NAIA', 'D3']

    for (const division of divisions) {
        const benchmark = getBenchmark(sport, position, division)
        if (!benchmark) continue

        const weightOk = benchmark.weight_min ? athleteWeight >= benchmark.weight_min * 0.9 : true
        const fortyOk = benchmark.forty_yard ? athleteFortyYard <= benchmark.forty_yard * 1.1 : true

        const gpaMin = division === 'FBS' || division === 'FCS' ? 2.3 : division === 'D2/NAIA' ? 2.2 : 0
        const gpaOk = coreGPA >= gpaMin

        if (weightOk && fortyOk && gpaOk) return division
    }

    return 'Needs Development'
}
