/**
 * localStorage のラッパ。
 * - localStorage が使えない環境(SSR/プライベートモード等)でも例外を投げない
 * - 破損した JSON が保存されていてもアプリをクラッシュさせない
 *   (構文エラーだけでなく「構文は正しいが期待した型ではない」データも
 *   バリデータで検出して fallback に落とす)
 */

function isStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

/** parse 済みの値が期待する型かどうかを判定する型ガード */
export type Validator<T> = (value: unknown) => value is T

/**
 * key に対応する値を読み出し、JSON.parse して validate に通してから返す。
 * 存在しない・構文が壊れている・型が期待と違う・localStorage が使えない場合は
 * fallback を返す。例外は外に投げない。
 */
export function readJSON<T>(key: string, fallback: T, validate: Validator<T>): T {
  if (!isStorageAvailable()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return validate(parsed) ? parsed : fallback
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

/** string の配列かどうか(favorites 用のバリデータ) */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

export const STORAGE_KEYS = {
  favorites: 'hobby-suggestion:favorites',
  lastAnswers: 'hobby-suggestion:last-answers',
} as const
