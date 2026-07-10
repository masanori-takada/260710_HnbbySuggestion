import { describe, expect, it } from 'vitest'
import { buildTraitProfile } from './profile'
import { QUESTIONS } from '../data/questions'
import type { Question } from '../data/questions'
import { TRAIT_AXES } from '../types'

describe('buildTraitProfile', () => {
  it('reads the selected option scores and averages the two questions per axis', () => {
    // すべての質問で「最後の選択肢(scores=4)」を選ぶ
    const answers: Record<string, number> = {}
    for (const q of QUESTIONS) answers[q.id] = q.options.length - 1
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

  it('ignores out-of-range option indices (falls back to neutral instead of crashing)', () => {
    const answers: Record<string, number> = {}
    for (const q of QUESTIONS) answers[q.id] = 99
    const profile = buildTraitProfile(QUESTIONS, answers)
    for (const axis of TRAIT_AXES) {
      expect(Number.isNaN(profile[axis])).toBe(false)
      expect(profile[axis]).toBe(2)
    }
  })

  it('uses option scores (not the option index) even when options are reordered', () => {
    // QUESTIONS の選択肢を逆順にしたコピーを作る。
    // 添字を軸スコアとして使う実装なら、逆順後の先頭(元 scores=4)を 0 と誤集計する。
    const reversed: Question[] = QUESTIONS.map((q) => ({
      ...q,
      options: [...q.options].reverse(),
    }))
    const answers: Record<string, number> = {}
    for (const q of reversed) answers[q.id] = 0 // 逆順後の先頭 = 元の scores=4 の選択肢
    const profile = buildTraitProfile(reversed, answers)
    for (const axis of TRAIT_AXES) {
      expect(profile[axis]).toBe(4)
    }
  })

  it('aggregates contributions to multiple axes from a single option', () => {
    const multiAxis: Question[] = [
      {
        id: 'multi',
        axis: 'social',
        text: 'multi-axis question',
        options: [
          { label: 'a', scores: { social: 4, physical: 0 } },
          { label: 'b', scores: { social: 0, physical: 4 } },
        ],
      },
    ]
    const profile = buildTraitProfile(multiAxis, { multi: 0 })
    expect(profile.social).toBe(4)
    expect(profile.physical).toBe(0)
    // 寄与のない軸はニュートラル
    expect(profile.creative).toBe(2)
  })

  it('clamps out-of-range score values defined in the data into [0,4]', () => {
    const weird: Question[] = [
      {
        id: 'w',
        axis: 'learning',
        text: 'weird scores',
        options: [{ label: 'x', scores: { learning: 99 } }],
      },
    ]
    const profile = buildTraitProfile(weird, { w: 0 })
    expect(profile.learning).toBe(4)
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
