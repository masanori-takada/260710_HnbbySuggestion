import { describe, expect, it } from 'vitest'
import { HOBBIES, HOBBY_CATEGORIES } from './hobbies'
import { TRAIT_AXES } from '../types'

describe('HOBBIES data integrity', () => {
  it('has at least 40 entries', () => {
    expect(HOBBIES.length).toBeGreaterThanOrEqual(40)
  })

  it('has unique ids', () => {
    const ids = HOBBIES.map((h) => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique names', () => {
    const names = HOBBIES.map((h) => h.name)
    expect(new Set(names).size).toBe(names.length)
  })

  for (const hobby of HOBBIES) {
    describe(`hobby: ${hobby.id}`, () => {
      it('has a non-empty name/description/category from the allowed list', () => {
        expect(hobby.name.length).toBeGreaterThan(0)
        expect(hobby.description.length).toBeGreaterThan(0)
        expect(HOBBY_CATEGORIES).toContain(hobby.category)
      })

      it('has a 5-axis profile with integers in [0,4]', () => {
        for (const axis of TRAIT_AXES) {
          const value = hobby.profile[axis]
          expect(typeof value).toBe('number')
          expect(Number.isInteger(value)).toBe(true)
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(4)
        }
        // プロファイルに余計な軸が含まれていないこと
        expect(Object.keys(hobby.profile).sort()).toEqual([...TRAIT_AXES].sort())
      })

      it('has consistent, non-negative cost fields', () => {
        expect(hobby.initialCostMin).toBeGreaterThanOrEqual(0)
        expect(hobby.initialCostMax).toBeGreaterThanOrEqual(hobby.initialCostMin)
        expect(hobby.monthlyCost).toBeGreaterThanOrEqual(0)
        expect(Number.isFinite(hobby.initialCostMin)).toBe(true)
        expect(Number.isFinite(hobby.initialCostMax)).toBe(true)
        expect(Number.isFinite(hobby.monthlyCost)).toBe(true)
      })

      it('has a positive weeklyHours value', () => {
        expect(hobby.weeklyHours).toBeGreaterThan(0)
        expect(Number.isFinite(hobby.weeklyHours)).toBe(true)
      })

      it('has at least one gear item and non-empty strings', () => {
        expect(hobby.gear.length).toBeGreaterThanOrEqual(1)
        for (const g of hobby.gear) expect(g.length).toBeGreaterThan(0)
      })

      it('has exactly 3 first steps, all non-empty', () => {
        expect(hobby.firstSteps).toHaveLength(3)
        for (const step of hobby.firstSteps) expect(step.length).toBeGreaterThan(0)
      })

      it('has at least one community keyword', () => {
        expect(hobby.communityKeywords.length).toBeGreaterThanOrEqual(1)
        for (const k of hobby.communityKeywords) expect(k.length).toBeGreaterThan(0)
      })

      it('has a boolean indoor flag', () => {
        expect(typeof hobby.indoor).toBe('boolean')
      })

      it('has a valid 3-tier starterKit with non-decreasing cost (free <= budget <= full)', () => {
        const { starterKit } = hobby
        expect(starterKit).toBeDefined()
        for (const tier of ['free', 'budget', 'full'] as const) {
          const plan = starterKit[tier]
          expect(plan.description.length).toBeGreaterThan(0)
          expect(Number.isFinite(plan.cost)).toBe(true)
          expect(plan.cost).toBeGreaterThanOrEqual(0)
        }
        expect(starterKit.free.cost).toBeLessThanOrEqual(starterKit.budget.cost)
        expect(starterKit.budget.cost).toBeLessThanOrEqual(starterKit.full.cost)
        // budget プランは「約5千円以内」の想定
        expect(starterKit.budget.cost).toBeLessThanOrEqual(5000)
      })
    })
  }

  it('covers every declared category with at least one hobby', () => {
    const usedCategories = new Set(HOBBIES.map((h) => h.category))
    for (const category of HOBBY_CATEGORIES) {
      expect(usedCategories.has(category)).toBe(true)
    }
  })
})
