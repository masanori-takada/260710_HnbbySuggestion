/**
 * localStorage のラッパ。
 * - localStorage が使えない環境(SSR/プライベートモード等)でも例外を投げない
 * - 破損した JSON が保存されていてもアプリをクラッシュさせない
 */

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

/**
 * key に対応する値を読み出し、JSON.parse して返す。
 * 存在しない・壊れている・localStorage が使えない場合は fallback を返す。
 */
export function readJSON<T>(key: string, fallback: T): T {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw) as unknown
    return parsed as T
  } catch {
    return fallback
  }
}

/**
 * value を JSON.stringify して key に保存する。
 * 失敗しても(容量オーバー・非対応環境など)例外を外に投げない。
 */
export function writeJSON<T>(key: string, value: T): boolean {
  if (!isStorageAvailable()) return false
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** key を削除する。失敗しても例外を投げない。 */
export function removeItem(key: string): void {
  if (!isStorageAvailable()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 何もしない(破損状態でもアプリを止めない)
  }
}

export const STORAGE_KEYS = {
  favorites: 'hobby-suggestion:favorites',
  lastAnswers: 'hobby-suggestion:last-answers',
  lastConstraints: 'hobby-suggestion:last-constraints',
} as const
