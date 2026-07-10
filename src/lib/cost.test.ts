import { describe, expect, it } from 'vitest'
import { computeAnnualCost } from './cost'
import type { Hobby } from '../types'

function makeHobby(overrides: Partial<Hobby> = {}): Hobby {
  return {
    id: 'test-hobby',
    name: 'テスト趣味',
    category: 'テスト',
    description: 'テスト用のダミー趣味です。',
    profile: { indoor_outdoor: 2, social: 2, physical: 2, creative: 2, learning: 2 },
    initialCostMin: 1000,
    initialCostMax: 3000,
    monthlyCost: 500,
    weeklyHours: 2,
    gear: ['道具A'],
    firstSteps: ['ステップ1', 'ステップ2', 'ステップ3'],
    communityKeywords: ['テスト'],
    indoor: true,
    starterKit: {
      free: { description: '無料で試す', cost: 0 },
      budget: { description: 'お試しセット', cost: 3000 },
      full: { description: '本格スタートセット', cost: 10000 },
    },
    ...overrides,
  }
}

describe('computeAnnualCost', () => {
  it('computes min/max as initial cost + monthly cost * 12', () => {
    const hobby = makeHobby({ initialCostMin: 1000, initialCostMax: 3000, monthlyCost: 500 })
    const result = computeAnnualCost(hobby)
    expect(result.min).toBe(1000 + 500 * 12)
    expect(result.max).toBe(3000 + 500 * 12)
  })

  it('handles zero monthly cost', () => {
    const hobby = makeHobby({ initialCostMin: 2000, initialCostMax: 5000, monthlyCost: 0 })
    const result = computeAnnualCost(hobby)
    expect(result.min).toBe(2000)
    expect(result.max).toBe(5000)
  })

  it('handles zero initial cost', () => {
    const hobby = makeHobby({ initialCostMin: 0, initialCostMax: 0, monthlyCost: 1000 })
    const result = computeAnnualCost(hobby)
    expect(result.min).toBe(12000)
    expect(result.max).toBe(12000)
  })

  it('never returns NaN and always has min <= max', () => {
    const hobbies = [
      makeHobby({ initialCostMin: 0, initialCostMax: 0, monthlyCost: 0 }),
      makeHobby({ initialCostMin: 500000, initialCostMax: 900000, monthlyCost: 20000 }),
      makeHobby({ initialCostMin: 3000, initialCostMax: 3000, monthlyCost: 500 }),
    ]
    for (const hobby of hobbies) {
      const result = computeAnnualCost(hobby)
      expect(Number.isNaN(result.min)).toBe(false)
      expect(Number.isNaN(result.max)).toBe(false)
      expect(result.min).toBeLessThanOrEqual(result.max)
      expect(result.min).toBeGreaterThanOrEqual(0)
    }
  })

  it('is a pure function (does not mutate the input hobby)', () => {
    const hobby = makeHobby()
    const before = JSON.stringify(hobby)
    computeAnnualCost(hobby)
    expect(JSON.stringify(hobby)).toBe(before)
  })
})
