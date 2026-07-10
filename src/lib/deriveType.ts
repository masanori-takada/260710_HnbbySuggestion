import { TRAIT_AXES } from '../types'
import type { TraitAxis, TraitProfile } from '../types'

const NEUTRAL = 2

/** 各軸の「低い(low)」「高い(high)」を表す形容表現(タイプ名の修飾語として使用) */
const AXIS_ADJECTIVES: Record<TraitAxis, { low: string; high: string }> = {
  indoor_outdoor: { low: '内にこもる', high: '外に飛び出す' },
  social: { low: 'ひとり静かな', high: '仲間と盛り上がる' },
  physical: { low: '穏やかな', high: '活動的な' },
  creative: { low: '鑑賞好きな', high: '創造力あふれる' },
  learning: { low: '気軽な', high: '探究心旺盛な' },
}

/** 各軸の「低い(low)」「高い(high)」を表す名詞(タイプ名の核として使用) */
const AXIS_NOUNS: Record<TraitAxis, { low: string; high: string }> = {
  indoor_outdoor: { low: '職人', high: '冒険家' },
  social: { low: '探究者', high: '盛り上げ役' },
  physical: { low: '安らぎ派', high: 'アクティブ派' },
  creative: { low: '目利き', high: 'クリエイター' },
  learning: { low: '自由人', high: '求道者' },
}

/**
 * 特性プロファイル(5軸・0〜4)から「あなたは○○タイプ」というタイプ名を導出する純関数。
 * ニュートラル値(2)からの乖離が大きい軸ほどタイプ名に強く反映される。
 * すべての軸がニュートラルな場合は「バランス型」を返す。
 * 5^5 = 3125 とおりのすべての組み合わせで、必ず非空文字列のタイプ名を返す。
 */
export function deriveType(profile: TraitProfile): string {
  const deviations = TRAIT_AXES.map((axis) => {
    const value = profile[axis]
    return { axis, value, deviation: Math.abs(value - NEUTRAL) }
  })

  const maxDeviation = Math.max(...deviations.map((d) => d.deviation))

  if (maxDeviation === 0) {
    return 'バランス型'
  }

  // 乖離が大きい順にソートし(同点は軸の定義順を維持する安定ソート)、
  // 最も特徴的な軸を「核」、次に特徴的な軸を「修飾語」として使う。
  const sorted = [...deviations].sort((a, b) => b.deviation - a.deviation)

  const primary = sorted[0]
  const secondary = sorted.find((d) => d.axis !== primary.axis && d.deviation > 0) ?? primary

  const primaryDirection = primary.value >= NEUTRAL ? 'high' : 'low'
  const secondaryDirection = secondary.value >= NEUTRAL ? 'high' : 'low'

  const noun = AXIS_NOUNS[primary.axis][primaryDirection]
  const adjective = AXIS_ADJECTIVES[secondary.axis][secondaryDirection]

  if (secondary.axis === primary.axis) {
    return `${noun}タイプ`
  }

  return `${adjective}${noun}タイプ`
}
