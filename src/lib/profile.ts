import { TRAIT_AXES } from '../types'
import type { TraitAxis, TraitProfile } from '../types'
import type { Question } from '../data/questions'

/**
 * 質問への回答(質問ID → 選択した選択肢の軸スコア 0〜4)から、
 * 5軸の特性プロファイル(各軸0〜4の整数)を組み立てる純関数。
 * 同一軸につき複数の質問がある場合は平均を四捨五入する。
 * 未回答の軸はニュートラル値(2)にフォールバックし、NaN を出さない。
 */
export function buildTraitProfile(
  questions: Question[],
  answers: Record<string, number>,
): TraitProfile {
  const sums: Record<TraitAxis, number> = {
    indoor_outdoor: 0,
    social: 0,
    physical: 0,
    creative: 0,
    learning: 0,
  }
  const counts: Record<TraitAxis, number> = {
    indoor_outdoor: 0,
    social: 0,
    physical: 0,
    creative: 0,
    learning: 0,
  }

  for (const question of questions) {
    const value = answers[question.id]
    if (typeof value !== 'number' || Number.isNaN(value)) continue
    const clamped = Math.min(4, Math.max(0, value))
    sums[question.axis] += clamped
    counts[question.axis] += 1
  }

  const profile = {} as TraitProfile
  for (const axis of TRAIT_AXES) {
    const count = counts[axis]
    const average = count > 0 ? sums[axis] / count : 2
    profile[axis] = Math.min(4, Math.max(0, Math.round(average)))
  }
  return profile
}
