import type { TraitAxis } from '../types'

/** 質問の1つの選択肢。選ぶと該当する軸のスコアに寄与する */
export interface QuestionOption {
  label: string
  /** この選択肢を選んだ時に、各軸に加算するスコア(0〜4) */
  scores: Partial<Record<TraitAxis, number>>
}

export interface Question {
  id: string
  text: string
  /** この質問が主に扱う軸(結果の集計に使う) */
  axis: TraitAxis
  options: QuestionOption[]
  /**
   * 内省質問(「子供の頃、時間を忘れて夢中になったのは?」のような
   * 自分の記憶・感覚を振り返るタイプの質問)かどうか。
   * 選択式で選択肢が軸スコアに寄与する仕組みは他の質問と同じ。
   */
  introspective?: boolean
}

/**
 * 特性診断の質問。各軸につき2問ずつ、計10問。
 * 各質問は同じ軸に対して0〜4の5段階の選択肢を持ち、
 * 同一軸の2問の平均をその軸の最終スコア(0〜4)とする。
 * このうち2〜3問は「内省質問」(子供の頃や過去の経験を振り返る設問)とし、
 * 選択式・軸スコアへの寄与という仕組みは他の質問と共通にしている。
 */
export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    axis: 'indoor_outdoor',
    text: '休日の過ごし方として理想に近いのは?',
    options: [
      { label: '家の中でゆっくり過ごしたい', scores: { indoor_outdoor: 0 } },
      { label: 'どちらかというと室内が好き', scores: { indoor_outdoor: 1 } },
      { label: '室内でも屋外でもどちらでも良い', scores: { indoor_outdoor: 2 } },
      { label: 'どちらかというと外に出たい', scores: { indoor_outdoor: 3 } },
      { label: '自然の中や屋外で過ごしたい', scores: { indoor_outdoor: 4 } },
    ],
  },
  {
    id: 'q2',
    axis: 'indoor_outdoor',
    introspective: true,
    text: '子供の頃、時間を忘れて夢中になったのはどんな遊び?',
    options: [
      { label: '家の中で本や絵にじっくり没頭していた', scores: { indoor_outdoor: 0 } },
      { label: '家の中で工作やゲームに没頭していた', scores: { indoor_outdoor: 1 } },
      { label: '室内でも外でも夢中になれるものがあった', scores: { indoor_outdoor: 2 } },
      { label: '近所を走り回って遊んでいた', scores: { indoor_outdoor: 3 } },
      { label: '外に出て自然の中で夢中になって遊んでいた', scores: { indoor_outdoor: 4 } },
    ],
  },
  {
    id: 'q3',
    axis: 'social',
    text: '趣味を楽しむとしたら?',
    options: [
      { label: '完全に一人で没頭したい', scores: { social: 0 } },
      { label: '基本一人で、たまに人と共有', scores: { social: 1 } },
      { label: '一人でもみんなとでも良い', scores: { social: 2 } },
      { label: '気の合う数人と一緒が良い', scores: { social: 3 } },
      { label: '大勢でワイワイやりたい', scores: { social: 4 } },
    ],
  },
  {
    id: 'q4',
    axis: 'social',
    text: '新しいコミュニティに参加することについて',
    options: [
      { label: 'できれば避けたい', scores: { social: 0 } },
      { label: 'あまり気が進まない', scores: { social: 1 } },
      { label: '内容次第では参加してもよい', scores: { social: 2 } },
      { label: '興味があれば積極的に参加したい', scores: { social: 3 } },
      { label: 'どんどん新しい人と交流したい', scores: { social: 4 } },
    ],
  },
  {
    id: 'q5',
    axis: 'physical',
    text: '体を動かすことについて',
    options: [
      { label: 'ほとんど動かしたくない', scores: { physical: 0 } },
      { label: '軽い運動程度なら', scores: { physical: 1 } },
      { label: '適度に体を動かしたい', scores: { physical: 2 } },
      { label: 'しっかり運動したい', scores: { physical: 3 } },
      { label: '汗だくになるくらい動きたい', scores: { physical: 4 } },
    ],
  },
  {
    id: 'q6',
    axis: 'physical',
    text: '普段の運動習慣は?',
    options: [
      { label: '運動はほぼしない', scores: { physical: 0 } },
      { label: 'たまに散歩する程度', scores: { physical: 1 } },
      { label: '週に数回、軽く体を動かす', scores: { physical: 2 } },
      { label: '定期的に運動している', scores: { physical: 3 } },
      { label: '日常的にしっかりトレーニングしている', scores: { physical: 4 } },
    ],
  },
  {
    id: 'q7',
    axis: 'creative',
    text: '趣味の時間は主にどちらを楽しみたい?',
    options: [
      { label: '完成された作品を鑑賞・消費したい', scores: { creative: 0 } },
      { label: 'どちらかというと鑑賞派', scores: { creative: 1 } },
      { label: '鑑賞も創作もどちらも楽しみたい', scores: { creative: 2 } },
      { label: 'どちらかというと創作派', scores: { creative: 3 } },
      { label: '自分の手で何かを作り出したい', scores: { creative: 4 } },
    ],
  },
  {
    id: 'q8',
    axis: 'creative',
    introspective: true,
    text: '達成感を覚えるのはどんな瞬間?',
    options: [
      { label: '良い作品や美しい景色に出会えたとき', scores: { creative: 0 } },
      { label: 'お気に入りのものを見つけて満足できたとき', scores: { creative: 1 } },
      { label: '何かを楽しんだときも、作ったときも', scores: { creative: 2 } },
      { label: '自分なりに手を加えて工夫できたとき', scores: { creative: 3 } },
      { label: '自分の手でゼロから何かを生み出せたとき', scores: { creative: 4 } },
    ],
  },
  {
    id: 'q9',
    axis: 'learning',
    text: '趣味に対する向き合い方として近いのは?',
    options: [
      { label: '気軽に楽しめれば十分', scores: { learning: 0 } },
      { label: 'あまり難しく考えたくない', scores: { learning: 1 } },
      { label: '気軽さと上達のバランスが良い', scores: { learning: 2 } },
      { label: 'ある程度上達を目指したい', scores: { learning: 3 } },
      { label: 'とことん学び、極めたい', scores: { learning: 4 } },
    ],
  },
  {
    id: 'q10',
    axis: 'learning',
    introspective: true,
    text: '何かに没頭して上達していった経験を振り返ると、近いのはどれ?',
    options: [
      { label: 'とにかく楽しければ結果は気にしなかった', scores: { learning: 0 } },
      { label: 'あまり上達を意識したことはなかった', scores: { learning: 1 } },
      { label: '楽しみながら少し上達すると嬉しかった', scores: { learning: 2 } },
      { label: '上手くなることに強いこだわりがあった', scores: { learning: 3 } },
      { label: '極めるまで何度も繰り返し練習していた', scores: { learning: 4 } },
    ],
  },
]
