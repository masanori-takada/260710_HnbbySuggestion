import { describe, expect, it } from 'vitest'
import { buildTraitProfile } from './profile'
import { QUESTIONS } from '../data/questions'
import { TRAIT_AXES } from '../types'

describe('buildTraitProfile', () => {
  it('averages the two questions per axis and rounds to the nearest integer', () => {
    const answers: Record<string, number> = {}
    for (const q of QUESTIONS) answers[q.id] = 4
    const profile = buildTraitProfile(QUESTIONS, answers)
    for (const axis of TRAIT_AXES) {
      expect(profile[axis]).toBe(4)
    }
  })

  it('falls back to neutral (2) for axes with no answers, without producing NaN', () => {
    const profile = buildTraitProfile(QUESTIONS, {})
    for (const axis of TRAIT_AXES) {
      expect(Number.isNaN(profile[axis])).toBe(false)
      expect(profile[axis]).toBe(2)
    }
  })

  it('clamps out-of-range answer values into [0,4]', () => {
    const answers: Record<string, number> = {}
    for (const q of QUESTIONS) answers[q.id] = 99
    const profile = buildTraitProfile(QUESTIONS, answers)
    for (const axis of TRAIT_AXES) {
      expect(profile[axis]).toBeLessThanOrEqual(4)
    }
  })

  it('produces every value within [0,4] as an integer for arbitrary partial answers', () => {
    const answers: Record<string, number> = { q1: 0, q3: 3 }
    const profile = buildTraitProfile(QUESTIONS, answers)
    for (const axis of TRAIT_AXES) {
      expect(Number.isInteger(profile[axis])).toBe(true)
      expect(profile[axis]).toBeGreaterThanOrEqual(0)
      expect(profile[axis]).toBeLessThanOrEqual(4)
    }
  })

  it('is deterministic for the same input', () => {
    const answers: Record<string, number> = { q1: 1, q2: 3, q5: 2 }
    expect(buildTraitProfile(QUESTIONS, answers)).toEqual(buildTraitProfile(QUESTIONS, { ...answers }))
  })
})
