import { deriveType } from '../lib/deriveType'
import { HobbyCard } from './HobbyCard'
import type { RecommendationResult, TraitProfile } from '../types'

export interface ResultListProps {
  profile: TraitProfile
  results: RecommendationResult[]
  region: string
  favorites: string[]
  onToggleFavorite: (hobbyId: string) => void
  onRestart: () => void
}

export function ResultList({
  profile,
  results,
  region,
  favorites,
  onToggleFavorite,
  onRestart,
}: ResultListProps) {
  const typeName = deriveType(profile)

  return (
    <section className="result-list">
      <div className="result-header">
        <p className="type-label">あなたは</p>
        <h2 className="type-name">{typeName}</h2>
        <button type="button" className="secondary-button" onClick={onRestart}>
          もう一度診断する
        </button>
      </div>

      {results.length === 0 ? (
        <p className="empty-state">おすすめできる趣味が見つかりませんでした。</p>
      ) : (
        <div className="hobby-grid">
          {results.map((result) => (
            <HobbyCard
              key={result.hobby.id}
              result={result}
              region={region}
              isFavorite={favorites.includes(result.hobby.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}
