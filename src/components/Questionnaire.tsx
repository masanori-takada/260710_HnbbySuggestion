import { useState } from 'react'
import type { FormEvent } from 'react'
import { QUESTIONS } from '../data/questions'
import { REGIONS } from '../data/regions'
import { BUDGET_LABELS, TIME_LABELS } from '../lib/recommend'
import type { BudgetLevel, Constraints, TimeLevel } from '../types'

export interface QuestionnaireProps {
  onComplete: (answers: Record<string, number>, constraints: Constraints) => void
  initialAnswers?: Record<string, number>
  initialConstraints?: Constraints
}

const DEFAULT_CONSTRAINTS: Constraints = {
  budget: 'under20000',
  time: 'under5h',
  region: '東京都',
}

const BUDGET_LEVELS = Object.keys(BUDGET_LABELS) as BudgetLevel[]
const TIME_LEVELS = Object.keys(TIME_LABELS) as TimeLevel[]

export function Questionnaire({ onComplete, initialAnswers, initialConstraints }: QuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers ?? {})
  const [constraints, setConstraints] = useState<Constraints>(initialConstraints ?? DEFAULT_CONSTRAINTS)

  const allAnswered = QUESTIONS.every((q) => typeof answers[q.id] === 'number')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!allAnswered) return
    onComplete(answers, constraints)
  }

  return (
    <form className="questionnaire" onSubmit={handleSubmit}>
      <h2>特性診断</h2>
      <p className="lead">
        全{QUESTIONS.length}問の質問に答えてください。回答から5つの特性軸を推定し、あなたにぴったりの趣味を提案します。
      </p>

      {QUESTIONS.map((question, qi) => (
        <fieldset key={question.id} className="question">
          <legend>
            <span className="question-number">Q{qi + 1}</span>
            {question.introspective && <span className="badge">内省質問</span>}
            <span className="question-text">{question.text}</span>
          </legend>
          <div className="options" role="radiogroup">
            {question.options.map((option, idx) => (
              <label
                key={idx}
                className={`option${answers[question.id] === idx ? ' selected' : ''}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={idx}
                  checked={answers[question.id] === idx}
                  onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: idx }))}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="constraints">
        <legend>制約条件</legend>

        <label className="field">
          <span>予算(初期投資の上限)</span>
          <select
            value={constraints.budget}
            onChange={(e) =>
              setConstraints((c) => ({ ...c, budget: e.target.value as BudgetLevel }))
            }
          >
            {BUDGET_LEVELS.map((level) => (
              <option key={level} value={level}>
                {BUDGET_LABELS[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>週に使える時間</span>
          <select
            value={constraints.time}
            onChange={(e) => setConstraints((c) => ({ ...c, time: e.target.value as TimeLevel }))}
          >
            {TIME_LEVELS.map((level) => (
              <option key={level} value={level}>
                {TIME_LABELS[level]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>お住まいの都道府県</span>
          <select
            value={constraints.region}
            onChange={(e) => setConstraints((c) => ({ ...c, region: e.target.value }))}
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="primary-button" disabled={!allAnswered}>
          診断結果を見る
        </button>
        {!allAnswered && <p className="hint">すべての質問に回答すると診断結果を表示できます。</p>}
      </div>
    </form>
  )
}
