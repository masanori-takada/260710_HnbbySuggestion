import { TRAIT_AXES } from '../types'
import type { TraitAxis, TraitProfile } from '../types'
import type { Question } from '../data/questions'

/**
 * 質問への回答(質問ID → 選択した選択肢の添字)から、
 * 5軸の特性プロファイル(各軸0〜4の整数)を組み立てる純関数。
 *
 * 各選択肢が持つ scores(軸 → 0〜4 の寄与)を実際に読んで集計するため、
 * 選択肢の並び順を入れ替えても scores の定義どおりに計算される。
 * 同一軸に複数の寄与がある場合は平均を四捨五入する。
 * 未回答・範囲外の添字の軸はニュートラル値(2)にフォールバックし、NaN を出さない。
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
    const selectedIndex = answers[question.id]
    if (typeof selectedIndex !== 'number' || !Number.isInteger(selectedIndex)) continue
    const option = question.options[selectedIndex]
    if (!option) continue

    for (const axis of TRAIT_AXES) {
      const score = option.scores[axis]
      if (typeof score !== 'number' || Number.isNaN(score)) continue
      const clamped = Math.min(4, Math.max(0, score))
      sums[axis] += clamped
      counts[axis] += 1
    }
  }

  const profile = {} as TraitProfile
  for (const axis of TRAIT_AXES) {
    const count = counts[axis]
    const average = count > 0 ? sums[axis] / count : 2
    profile[axis] = Math.min(4, Math.max(0, Math.round(average)))
  }
  return profile
}
