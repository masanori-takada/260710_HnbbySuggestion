import { useEffect, useMemo, useState } from 'react'
import { Questionnaire } from './components/Questionnaire'
import { ResultList } from './components/ResultList'
import { HOBBIES } from './data/hobbies'
import { QUESTIONS } from './data/questions'
import { recommend } from './lib/recommend'
import { buildTraitProfile } from './lib/profile'
import { readJSON, writeJSON, STORAGE_KEYS } from './lib/storage'
import type { Constraints } from './types'

type Screen = 'intro' | 'quiz' | 'result'

interface SavedDiagnosis {
  answers: Record<string, number>
  constraints: Constraints
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [saved, setSaved] = useState<SavedDiagnosis | null>(() =>
    readJSON<SavedDiagnosis | null>(STORAGE_KEYS.lastAnswers, null),
  )
  const [favorites, setFavorites] = useState<string[]>(() =>
    readJSON<string[]>(STORAGE_KEYS.favorites, []),
  )

  useEffect(() => {
    writeJSON(STORAGE_KEYS.favorites, favorites)
  }, [favorites])

  const profile = useMemo(() => {
    if (!saved) return null
    return buildTraitProfile(QUESTIONS, saved.answers)
  }, [saved])

  const results = useMemo(() => {
    if (!saved || !profile) return []
    return recommend(profile, saved.constraints, HOBBIES)
  }, [saved, profile])

  function handleComplete(answers: Record<string, number>, constraints: Constraints) {
    const nextSaved: SavedDiagnosis = { answers, constraints }
    setSaved(nextSaved)
    writeJSON(STORAGE_KEYS.lastAnswers, nextSaved)
    setScreen('result')
  }

  function handleRestart() {
    setScreen('quiz')
  }

  function toggleFavorite(hobbyId: string) {
    setFavorites((prev) =>
      prev.includes(hobbyId) ? prev.filter((id) => id !== hobbyId) : [...prev, hobbyId],
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>趣味提案アプリ</h1>
        <p className="tagline">
          あなたの特性・予算・使える時間から、今日から始められる趣味を提案します。
        </p>
      </header>

      <main className="app-main">
        {screen === 'intro' && (
          <section className="intro">
            <p>
              {QUESTIONS.length}個の質問に答えるだけで、あなたにぴったりの趣味をマッチ度つきで提案します。
              初期費用・道具・スターターキット・地域のコミュニティの探し方まで、今日から始められる情報つきです。
            </p>
            <div className="intro-actions">
              <button type="button" className="primary-button" onClick={() => setScreen('quiz')}>
                診断をはじめる
              </button>
              {saved && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setScreen('result')}
                >
                  前回の診断結果を見る
                </button>
              )}
            </div>
          </section>
        )}

        {screen === 'quiz' && (
          <Questionnaire
            initialAnswers={saved?.answers}
            initialConstraints={saved?.constraints}
            onComplete={handleComplete}
          />
        )}

        {screen === 'result' && profile && saved && (
          <ResultList
            profile={profile}
            results={results}
            region={saved.constraints.region}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onRestart={handleRestart}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>診断結果とお気に入りは、この端末内(ブラウザのlocalStorage)にのみ保存されます。</p>
      </footer>
    </div>
  )
}

export default App
