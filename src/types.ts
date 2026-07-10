// 趣味提案アプリ 共通型定義

/** 特性診断の5軸 */
export type TraitAxis =
  | 'indoor_outdoor'
  | 'social'
  | 'physical'
  | 'creative'
  | 'learning'

/** 5軸それぞれ 0〜4 の整数スコアを持つプロファイル */
export type TraitProfile = Record<TraitAxis, number>

export const TRAIT_AXES: readonly TraitAxis[] = [
  'indoor_outdoor',
  'social',
  'physical',
  'creative',
  'learning',
]

/** 初期投資の予算レベル(選択式) */
export type BudgetLevel = 'under5000' | 'under20000' | 'under100000' | 'unlimited'

/** 週に使える時間レベル(選択式) */
export type TimeLevel = 'under2h' | 'under5h' | 'under10h' | 'over10h'

/** 診断で決まる制約条件 */
export interface Constraints {
  budget: BudgetLevel
  time: TimeLevel
  region: string
}

/** スターターキットの1プラン(無料 / お試し / 本格) */
export interface StarterKitPlan {
  /** プランの内容説明 */
  description: string
  /** 概算費用(円)。無料プランは 0 */
  cost: number
}

/** 3段階のスターターキット。お金の不安を下げるための「まずどう始めるか」の提案 */
export interface StarterKit {
  /** 無料で試す方法(見学・レンタル・体験会・家にあるもので代用など) */
  free: StarterKitPlan
  /** 約5,000円以内のお試しセット */
  budget: StarterKitPlan
  /** 本格スタートセット */
  full: StarterKitPlan
}

/** 趣味データベースの1エントリ */
export interface Hobby {
  id: string
  name: string
  category: string
  description: string
  /** 5軸のプロファイル(0〜4) */
  profile: TraitProfile
  /** 初期投資の下限(円) */
  initialCostMin: number
  /** 初期投資の上限(円) */
  initialCostMax: number
  /** 月々のランニングコスト目安(円) */
  monthlyCost: number
  /** 週あたりに必要な時間の目安(時間) */
  weeklyHours: number
  /** 必要な道具・持ち物 */
  gear: string[]
  /** 始め方の最初の3ステップ */
  firstSteps: [string, string, string]
  /** 地域コミュニティ検索用のキーワード */
  communityKeywords: string[]
  /** 屋内で完結できるか */
  indoor: boolean
  /** 3段階のスターターキット(無料/お試し/本格) */
  starterKit: StarterKit
}

/** 推薦エンジンの出力 */
export interface RecommendationResult {
  hobby: Hobby
  /** マッチ度 0〜100 の整数 */
  score: number
  /** オススメする理由 */
  reasons: string[]
  /** 予算・時間超過などの注意点 */
  warnings: string[]
}
