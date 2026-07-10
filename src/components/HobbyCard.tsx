import { buildCommunityLinks } from '../lib/community'
import { computeAnnualCost, formatAnnualCost } from '../lib/cost'
import type { RecommendationResult } from '../types'

export interface HobbyCardProps {
  result: RecommendationResult
  region: string
  isFavorite: boolean
  onToggleFavorite: (hobbyId: string) => void
}

function formatYen(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`
}

export function HobbyCard({ result, region, isFavorite, onToggleFavorite }: HobbyCardProps) {
  const { hobby, score, reasons, warnings } = result
  const links = buildCommunityLinks(region, hobby)
  const annualCost = computeAnnualCost(hobby)

  return (
    <article className="hobby-card">
      <header className="hobby-card-header">
        <div className="hobby-title">
          <span className="hobby-category">{hobby.category}</span>
          <h3>{hobby.name}</h3>
        </div>
        <div className="hobby-score">
          <span className="score-value">{score}%</span>
          <span className="score-label">マッチ度</span>
        </div>
        <button
          type="button"
          className={`favorite-button${isFavorite ? ' active' : ''}`}
          onClick={() => onToggleFavorite(hobby.id)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? 'お気に入りから外す' : 'お気に入りに追加'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      </header>

      <p className="hobby-description">{hobby.description}</p>

      {reasons.length > 0 && (
        <ul className="hobby-reasons">
          {reasons.map((reason, i) => (
            <li key={`reason-${i}`}>{reason}</li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="hobby-warnings">
          {warnings.map((warning, i) => (
            <li key={`warning-${i}`}>注意: {warning}</li>
          ))}
        </ul>
      )}

      <section className="hobby-section">
        <h4>初期投資と道具</h4>
        <p>
          初期投資 目安 {formatYen(hobby.initialCostMin)}〜{formatYen(hobby.initialCostMax)} /
          月額目安 {formatYen(hobby.monthlyCost)}
        </p>
        <ul className="gear-list">
          {hobby.gear.map((item, i) => (
            <li key={`gear-${i}`}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="hobby-section">
        <h4>スターターキット</h4>
        <dl className="starter-kit">
          <div className="starter-kit-tier">
            <dt>無料で試す</dt>
            <dd>
              {hobby.starterKit.free.description}
              <span className="starter-kit-cost"> (概算 {formatYen(hobby.starterKit.free.cost)})</span>
            </dd>
          </div>
          <div className="starter-kit-tier">
            <dt>お試し(〜5,000円)</dt>
            <dd>
              {hobby.starterKit.budget.description}
              <span className="starter-kit-cost"> (概算 {formatYen(hobby.starterKit.budget.cost)})</span>
            </dd>
          </div>
          <div className="starter-kit-tier">
            <dt>本格スタート</dt>
            <dd>
              {hobby.starterKit.full.description}
              <span className="starter-kit-cost"> (概算 {formatYen(hobby.starterKit.full.cost)})</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="hobby-section">
        <h4>年間費用シミュレータ</h4>
        <p>{formatAnnualCost(annualCost)}</p>
        <p className="hobby-note">初期投資 + 月額 × 12ヶ月で試算した目安です。</p>
      </section>

      <section className="hobby-section">
        <h4>始め方の3ステップ</h4>
        <ol className="first-steps">
          {hobby.firstSteps.map((step, i) => (
            <li key={`step-${i}`}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="hobby-section">
        <h4>{region ? `${region}の` : ''}コミュニティを探す</h4>
        <ul className="community-links">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.url} target="_blank" rel="noreferrer">
                {link.label}
              </a>
              <span className="community-desc">{link.description}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
