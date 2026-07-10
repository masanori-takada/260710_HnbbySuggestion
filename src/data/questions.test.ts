import { describe, expect, it } from 'vitest'
import { QUESTIONS } from './questions'
import { TRAIT_AXES } from '../types'

describe('QUESTIONS data integrity', () => {
  it('has 10 questions, 2 per axis', () => {
    expect(QUESTIONS).toHaveLength(10)
    for (const axis of TRAIT_AXES) {
      expect(QUESTIONS.filter((q) => q.axis === axis)).toHaveLength(2)
    }
  })

  it('includes 2-3 introspective questions using the same selectable-option format', () => {
    const introspective = QUESTIONS.filter((q) => q.introspective)
    expect(introspective.length).toBeGreaterThanOrEqual(2)
    expect(introspective.length).toBeLessThanOrEqual(3)
    for (const q of introspective) {
      expect(q.options).toHaveLength(5)
    }
  })

  it('every question has 5 options with scores 0-4 covering the question axis', () => {
    for (const q of QUESTIONS) {
      expect(q.options).toHaveLength(5)
      const values = q.options.map((o) => o.scores[q.axis])
      expect(values.sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([0, 1, 2, 3, 4])
    }
  })

  it('has unique ids and non-empty text/labels', () => {
    const ids = QUESTIONS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const q of QUESTIONS) {
      expect(q.text.length).toBeGreaterThan(0)
      for (const opt of q.options) {
        expect(opt.label.length).toBeGreaterThan(0)
      }
    }
  })
})
