import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** localStorage の最小限のインメモリ実装(テスト用) */
class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

describe('storage', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the fallback when window/localStorage is unavailable (e.g. SSR)', async () => {
    vi.unstubAllGlobals()
    const { readJSON, writeJSON } = await import('./storage')
    expect(readJSON('missing-key', { foo: 'bar' })).toEqual({ foo: 'bar' })
    // 書き込みも例外を投げず false を返す
    expect(writeJSON('missing-key', { a: 1 })).toBe(false)
  })

  it('round-trips a value through JSON', async () => {
    vi.stubGlobal('window', { localStorage: new MemoryStorage() })
    const { readJSON, writeJSON } = await import('./storage')
    writeJSON('key', { hello: 'world', n: 42 })
    expect(readJSON('key', null)).toEqual({ hello: 'world', n: 42 })
  })

  it('returns the fallback (not a crash) for corrupted JSON', async () => {
    const mem = new MemoryStorage()
    mem.setItem('corrupt', '{ this is not valid json')
    vi.stubGlobal('window', { localStorage: mem })
    const { readJSON } = await import('./storage')
    expect(() => readJSON('corrupt', 'fallback')).not.toThrow()
    expect(readJSON('corrupt', 'fallback')).toBe('fallback')
  })

  it('returns the fallback for a missing key', async () => {
    vi.stubGlobal('window', { localStorage: new MemoryStorage() })
    const { readJSON } = await import('./storage')
    expect(readJSON('nope', 'default-value')).toBe('default-value')
  })

  it('removeItem never throws even without localStorage', async () => {
    vi.unstubAllGlobals()
    const { removeItem } = await import('./storage')
    expect(() => removeItem('anything')).not.toThrow()
  })

  it('writeJSON never throws when localStorage.setItem throws (e.g. quota exceeded)', async () => {
    const throwing: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {
        throw new DOMException('QuotaExceededError')
      },
    }
    vi.stubGlobal('window', { localStorage: throwing })
    const { writeJSON } = await import('./storage')
    expect(() => writeJSON('x', { big: 'data' })).not.toThrow()
    expect(writeJSON('x', { big: 'data' })).toBe(false)
  })
})
