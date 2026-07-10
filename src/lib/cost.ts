import type { Hobby } from '../types'

export interface AnnualCostRange {
  /** 年間費用の下限(円) = initialCostMin + monthlyCost * 12 */
  min: number
  /** 年間費用の上限(円) = initialCostMax + monthlyCost * 12 */
  max: number
}

/**
 * 初期投資と月額ランニングコストから、1年間で想定される費用レンジを試算する純関数。
 * 計算式: 初期投資(下限/上限) + 月額 × 12
 */
export function computeAnnualCost(hobby: Hobby): AnnualCostRange {
  const yearlyRunningCost = hobby.monthlyCost * 12
  return {
    min: hobby.initialCostMin + yearlyRunningCost,
    max: hobby.initialCostMax + yearlyRunningCost,
  }
}

/** 表示用に「12,000円〜24,000円」のような文字列を組み立てる */
export function formatAnnualCost(range: AnnualCostRange): string {
  const format = (n: number) => `${n.toLocaleString('ja-JP')}円`
  if (range.min === range.max) return `年間 目安 ${format(range.min)}`
  return `年間 目安 ${format(range.min)}〜${format(range.max)}`
}
