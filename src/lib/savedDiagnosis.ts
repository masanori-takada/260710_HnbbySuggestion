import { BUDGET_LIMITS, TIME_LIMITS } from './recommend'
import type { Constraints } from '../types'

/** localStorage に保存する「前回の診断」データ */
export interface SavedDiagnosis {
  answers: Record<string, number>
  constraints: Constraints
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isConstraints(value: unknown): value is Constraints {
  if (!isPlainObject(value)) return false
  return (
    typeof value.budget === 'string' &&
    value.budget in BUDGET_LIMITS &&
    typeof value.time === 'string' &&
    value.time in TIME_LIMITS &&
    typeof value.region === 'string'
  )
}

/**
 * localStorage から読んだ値が SavedDiagnosis の形をしているかを検証する型ガード。
 * 「構文としては正しい JSON だが期待した型ではない」破損データ
 * (数値・null・constraints 欠落など)を弾くために使う。
 */
export function isSavedDiagnosis(value: unknown): value is SavedDiagnosis {
  if (!isPlainObject(value)) return false
  if (!isPlainObject(value.answers)) return false
  if (!Object.values(value.answers).every((v) => typeof v === 'number' && !Number.isNaN(v))) {
    return false
  }
  return isConstraints(value.constraints)
}
