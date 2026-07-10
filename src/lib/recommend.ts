import { TRAIT_AXES } from '../types'
import type {
  BudgetLevel,
  Constraints,
  Hobby,
  RecommendationResult,
  TimeLevel,
  TraitAxis,
  TraitProfile,
} from '../types'

/** 予算レベルごとの初期投資上限(円)。unlimited は Infinity。 */
export const BUDGET_LIMITS: Record<BudgetLevel, number> = {
  under5000: 5000,
  under20000: 20000,
  under100000: 100000,
  unlimited: Infinity,
}

/** 週の時間レベルごとの上限(時間)。over10h は Infinity。 */
export const TIME_LIMITS: Record<TimeLevel, number> = {
  under2h: 2,
  under5h: 5,
  under10h: 10,
  over10h: Infinity,
}

export const BUDGET_LABELS: Record<BudgetLevel, string> = {
  under5000: '〜5,000円',
  under20000: '〜20,000円',
  under100000: '〜100,000円',
  unlimited: '上限なし',
}

export const TIME_LABELS: Record<TimeLevel, string> = {
  under2h: '週2時間まで',
  under5h: '週5時間まで',
  under10h: '週10時間まで',
  over10h: '週10時間以上OK',
}

/** 各軸の最大値(0〜4)。マンハッタン距離の正規化に使う。 */
const AXIS_MAX = 4
/** 5軸すべてが最大値だけ離れている場合の距離(=最大距離)。 */
const MAX_DISTANCE = TRAIT_AXES.length * AXIS_MAX

/**
 * 2つの特性プロファイル間の類似度を 0〜100 の整数で返す純関数。
 * 5軸のマンハッタン距離を最大距離で正規化し、100点満点に変換する。
 */
export function similarity(a: TraitProfile, b: TraitProfile): number {
  let distance = 0
  for (const axis of TRAIT_AXES) {
    distance += Math.abs(a[axis] - b[axis])
  }
  const ratio = distance / MAX_DISTANCE
  const score = Math.round((1 - ratio) * 100)
  // 数値誤差での範囲外を念のためクランプする
  return Math.min(100, Math.max(0, score))
}

const AXIS_DESCRIPTORS: Record<TraitAxis, { low: string; mid: string; high: string }> = {
  indoor_outdoor: { low: '屋内でのんびり楽しめる', mid: '屋内でも屋外でも楽しめる', high: '屋外で体を動かして楽しむ' },
  social: { low: '一人でじっくり没頭できる', mid: '一人でもみんなとでも楽しめる', high: 'みんなで盛り上がって楽しむ' },
  physical: { low: 'あまり体力を使わずに楽しめる', mid: '適度に体を動かして楽しむ', high: 'しっかり体を動かして楽しむ' },
  creative: { low: '鑑賞・体験を中心に楽しめる', mid: '鑑賞と創作の両方を楽しめる', high: '自分の手で創作・発信して楽しむ' },
  learning: { low: '気軽に楽しめる', mid: '気軽さと上達のバランスが良い', high: 'じっくり学び上達を追求できる' },
}

function descriptorFor(axis: TraitAxis, value: number): string {
  if (value <= 1) return AXIS_DESCRIPTORS[axis].low
  if (value >= 3) return AXIS_DESCRIPTORS[axis].high
  return AXIS_DESCRIPTORS[axis].mid
}

function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`
}

/**
 * ユーザーの回答傾向と趣味のプロファイルが近い軸から「オススメ理由」の文章を組み立てる。
 * 最大2軸まで(差が小さい順)を採用する。
 */
function buildReasons(user: TraitProfile, hobby: Hobby): string[] {
  const diffs = TRAIT_AXES.map((axis) => ({
    axis,
    diff: Math.abs(user[axis] - hobby.profile[axis]),
  })).sort((a, b) => a.diff - b.diff)

  const matched = diffs.filter((d) => d.diff <= 1).slice(0, 2)
  const chosen = matched.length > 0 ? matched : diffs.slice(0, 1)

  const descriptions = chosen.map((d) => descriptorFor(d.axis, hobby.profile[d.axis]))
  const uniqueDescriptions = Array.from(new Set(descriptions))

  return [`${hobby.name}は${uniqueDescriptions.join('。')}趣味で、あなたの回答と近い傾向があります。`]
}

/**
 * 予算超過の減点とその注意文を計算する。ハードフィルタはせず、
 * 超過分に応じて 0〜40 点を減点しつつ、趣味自体は候補に残す。
 */
function budgetPenalty(hobby: Hobby, budget: BudgetLevel): { penalty: number; warning?: string } {
  const limit = BUDGET_LIMITS[budget]
  if (!Number.isFinite(limit) || hobby.initialCostMin <= limit) {
    return { penalty: 0 }
  }
  const overageRatio = limit > 0 ? (hobby.initialCostMin - limit) / limit : 1
  const penalty = Math.min(40, Math.round(overageRatio * 40))
  const warning = `初期投資が目安${formatYen(hobby.initialCostMin)}〜で、選択した予算(${BUDGET_LABELS[budget]})を超える可能性があります。`
  return { penalty, warning }
}

/**
 * 週の時間超過の減点とその注意文を計算する。ハードフィルタはせず、
 * 超過分に応じて 0〜30 点を減点しつつ、趣味自体は候補に残す。
 */
function timePenalty(hobby: Hobby, time: TimeLevel): { penalty: number; warning?: string } {
  const limit = TIME_LIMITS[time]
  if (!Number.isFinite(limit) || hobby.weeklyHours <= limit) {
    return { penalty: 0 }
  }
  const overageRatio = limit > 0 ? (hobby.weeklyHours - limit) / limit : 1
  const penalty = Math.min(30, Math.round(overageRatio * 30))
  const warning = `週あたり目安${hobby.weeklyHours}時間が必要で、選択した使える時間(${TIME_LABELS[time]})を超える可能性があります。`
  return { penalty, warning }
}

/**
 * 特性診断結果と制約条件から、趣味データベースの中から上位6件を推薦する純関数。
 * 予算・時間の超過はハードフィルタではなく減点として扱い、注意文とともに候補に残す。
 */
export function recommend(
  user: TraitProfile,
  constraints: Constraints,
  hobbies: Hobby[],
): RecommendationResult[] {
  const results: RecommendationResult[] = hobbies.map((hobby) => {
    const baseScore = similarity(user, hobby.profile)
    const budget = budgetPenalty(hobby, constraints.budget)
    const time = timePenalty(hobby, constraints.time)

    const warnings: string[] = []
    if (budget.warning) warnings.push(budget.warning)
    if (time.warning) warnings.push(time.warning)

    const score = Math.min(100, Math.max(0, Math.round(baseScore - budget.penalty - time.penalty)))

    return {
      hobby,
      score,
      reasons: buildReasons(user, hobby),
      warnings,
    }
  })

  return results
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
}
