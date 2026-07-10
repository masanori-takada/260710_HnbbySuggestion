import { describe, expect, it } from 'vitest'
import { recommend, similarity, BUDGET_LIMITS, TIME_LIMITS } from './recommend'
import type { Constraints, Hobby, TraitProfile } from '../types'

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

const NEUTRAL: TraitProfile = { indoor_outdoor: 2, social: 2, physical: 2, creative: 2, learning: 2 }

const LOOSE_CONSTRAINTS: Constraints = { budget: 'unlimited', time: 'over10h', region: '東京都' }

describe('similarity', () => {
  it('returns 100 for an identical profile', () => {
    expect(similarity(NEUTRAL, NEUTRAL)).toBe(100)
  })

  it('returns 0 for the maximally opposite profile', () => {
    const min: TraitProfile = { indoor_outdoor: 0, social: 0, physical: 0, creative: 0, learning: 0 }
    const max: TraitProfile = { indoor_outdoor: 4, social: 4, physical: 4, creative: 4, learning: 4 }
    expect(similarity(min, max)).toBe(0)
  })

  it('never returns NaN or out-of-range values', () => {
    for (let i = 0; i < 5; i += 1) {
      const a: TraitProfile = {
        indoor_outdoor: i % 5,
        social: (i + 1) % 5,
        physical: (i + 2) % 5,
        creative: (i + 3) % 5,
        learning: (i + 4) % 5,
      }
      const s = similarity(a, NEUTRAL)
      expect(Number.isNaN(s)).toBe(false)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(100)
    }
  })

  it('is symmetric', () => {
    const a: TraitProfile = { indoor_outdoor: 1, social: 3, physical: 0, creative: 4, learning: 2 }
    const b: TraitProfile = { indoor_outdoor: 4, social: 1, physical: 2, creative: 0, learning: 3 }
    expect(similarity(a, b)).toBe(similarity(b, a))
  })
})

describe('recommend', () => {
  it('returns at most 6 results sorted by descending score', () => {
    const hobbies = Array.from({ length: 20 }, (_, i) =>
      makeHobby({
        id: `hobby-${i}`,
        profile: {
          indoor_outdoor: i % 5,
          social: (i * 2) % 5,
          physical: (i * 3) % 5,
          creative: (i + 1) % 5,
          learning: (i + 2) % 5,
        },
      }),
    )
    const results = recommend(NEUTRAL, LOOSE_CONSTRAINTS, hobbies)
    expect(results.length).toBeLessThanOrEqual(6)
    for (let i = 1; i < results.length; i += 1) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it('never produces NaN scores and always stays within 0-100', () => {
    const hobbies = [
      makeHobby({ id: 'a', initialCostMin: 0, initialCostMax: 0, weeklyHours: 0 }),
      makeHobby({ id: 'b', initialCostMin: 500000, initialCostMax: 900000, weeklyHours: 40 }),
      makeHobby({ id: 'c', initialCostMin: 5000, initialCostMax: 5000, weeklyHours: 2 }),
    ]
    const constraints: Constraints = { budget: 'under5000', time: 'under2h', region: '大阪府' }
    const results = recommend(NEUTRAL, constraints, hobbies)
    for (const r of results) {
      expect(Number.isNaN(r.score)).toBe(false)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(Number.isInteger(r.score)).toBe(true)
    }
  })

  it('does not hard-filter hobbies that exceed the budget; it penalizes and warns instead', () => {
    const expensive = makeHobby({ id: 'expensive', initialCostMin: 300000, initialCostMax: 500000 })
    const constraints: Constraints = { budget: 'under5000', time: 'over10h', region: '北海道' }
    const results = recommend(NEUTRAL, constraints, [expensive])
    expect(results).toHaveLength(1)
    expect(results[0].hobby.id).toBe('expensive')
    expect(results[0].warnings.some((w) => w.includes('予算'))).toBe(true)
  })

  it('warns when initialCostMin fits the budget but initialCostMax exceeds it (e.g. piano with min=0)', () => {
    // ピアノ型: 無料で始められるが本格的に揃えると高額
    const piano = makeHobby({ id: 'piano-like', initialCostMin: 0, initialCostMax: 300000 })
    const constraints: Constraints = { budget: 'under5000', time: 'over10h', region: '東京都' }
    const results = recommend(NEUTRAL, constraints, [piano])
    expect(results).toHaveLength(1)
    expect(results[0].warnings.some((w) => w.includes('予算'))).toBe(true)
    // 本格的に揃えた場合のレンジが注意文に含まれること
    expect(results[0].warnings.some((w) => w.includes('300,000円'))).toBe(true)
    // 減点されていること(制約なしより低いスコア)
    const loose = recommend(NEUTRAL, LOOSE_CONSTRAINTS, [piano])[0]
    expect(results[0].score).toBeLessThan(loose.score)
  })

  it('penalizes a hobby whose minimum cost exceeds the budget more than one where only the maximum does', () => {
    const maxOnly = makeHobby({ id: 'max-only', initialCostMin: 0, initialCostMax: 500000 })
    const minToo = makeHobby({ id: 'min-too', initialCostMin: 300000, initialCostMax: 500000 })
    const constraints: Constraints = { budget: 'under5000', time: 'over10h', region: '東京都' }
    const results = recommend(NEUTRAL, constraints, [maxOnly, minToo])
    const maxOnlyResult = results.find((r) => r.hobby.id === 'max-only')!
    const minTooResult = results.find((r) => r.hobby.id === 'min-too')!
    expect(minTooResult.score).toBeLessThan(maxOnlyResult.score)
  })

  it('does not hard-filter hobbies that exceed the weekly time budget; it penalizes and warns instead', () => {
    const timeHeavy = makeHobby({ id: 'time-heavy', weeklyHours: 30 })
    const constraints: Constraints = { budget: 'unlimited', time: 'under2h', region: '北海道' }
    const results = recommend(NEUTRAL, constraints, [timeHeavy])
    expect(results).toHaveLength(1)
    expect(results[0].warnings.some((w) => w.includes('時間'))).toBe(true)
  })

  it('gives a lower score to a hobby that exceeds budget/time than the same hobby under unlimited constraints', () => {
    const hobby = makeHobby({ id: 'over-budget', initialCostMin: 300000, initialCostMax: 500000, weeklyHours: 30 })
    const strict: Constraints = { budget: 'under5000', time: 'under2h', region: '東京都' }
    const loose: Constraints = { budget: 'unlimited', time: 'over10h', region: '東京都' }
    const strictResult = recommend(NEUTRAL, strict, [hobby])[0]
    const looseResult = recommend(NEUTRAL, loose, [hobby])[0]
    expect(strictResult.score).toBeLessThan(looseResult.score)
  })

  it('has no warnings when a hobby comfortably fits the budget and time constraints', () => {
    const hobby = makeHobby({ id: 'cheap', initialCostMin: 500, initialCostMax: 1000, weeklyHours: 1 })
    const constraints: Constraints = { budget: 'unlimited', time: 'over10h', region: '東京都' }
    const results = recommend(NEUTRAL, constraints, [hobby])
    expect(results[0].warnings).toHaveLength(0)
  })

  it('produces at least one non-empty reason for every recommendation', () => {
    const hobbies = [makeHobby({ id: 'a' }), makeHobby({ id: 'b', profile: { indoor_outdoor: 4, social: 4, physical: 4, creative: 4, learning: 4 } })]
    const results = recommend(NEUTRAL, LOOSE_CONSTRAINTS, hobbies)
    for (const r of results) {
      expect(r.reasons.length).toBeGreaterThan(0)
      for (const reason of r.reasons) {
        expect(reason.length).toBeGreaterThan(0)
      }
    }
  })

  it('handles an empty hobby list without throwing', () => {
    expect(recommend(NEUTRAL, LOOSE_CONSTRAINTS, [])).toEqual([])
  })

  it('exposes finite numeric limits for every budget and time level except the unlimited ones', () => {
    expect(BUDGET_LIMITS.under5000).toBe(5000)
    expect(BUDGET_LIMITS.under20000).toBe(20000)
    expect(BUDGET_LIMITS.under100000).toBe(100000)
    expect(BUDGET_LIMITS.unlimited).toBe(Infinity)

    expect(TIME_LIMITS.under2h).toBe(2)
    expect(TIME_LIMITS.under5h).toBe(5)
    expect(TIME_LIMITS.under10h).toBe(10)
    expect(TIME_LIMITS.over10h).toBe(Infinity)
  })
})
