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

const anyValue = (_value: unknown): _value is unknown => true

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
    expect(readJSON('missing-key', { foo: 'bar' }, anyValue)).toEqual({ foo: 'bar' })
    // 書き込みも例外を投げず false を返す
    expect(writeJSON('missing-key', { a: 1 })).toBe(false)
  })

  it('round-trips a value through JSON', async () => {
    vi.stubGlobal('window', { localStorage: new MemoryStorage() })
    const { readJSON, writeJSON } = await import('./storage')
    writeJSON('key', { hello: 'world', n: 42 })
    expect(readJSON('key', null, anyValue)).toEqual({ hello: 'world', n: 42 })
  })

  it('returns the fallback (not a crash) for syntactically corrupted JSON', async () => {
    const mem = new MemoryStorage()
    mem.setItem('corrupt', '{ this is not valid json')
    vi.stubGlobal('window', { localStorage: mem })
    const { readJSON } = await import('./storage')
    expect(() => readJSON('corrupt', 'fallback', anyValue)).not.toThrow()
    expect(readJSON('corrupt', 'fallback', anyValue)).toBe('fallback')
  })

  it('returns the fallback for a missing key', async () => {
    vi.stubGlobal('window', { localStorage: new MemoryStorage() })
    const { readJSON } = await import('./storage')
    expect(readJSON('nope', 'default-value', anyValue)).toBe('default-value')
  })

  describe('valid JSON with the wrong shape (type-level corruption)', () => {
    it('favorites: rejects a number, null, object, and mixed arrays; accepts only string arrays', async () => {
      const mem = new MemoryStorage()
      vi.stubGlobal('window', { localStorage: mem })
      const { readJSON, isStringArray } = await import('./storage')

      for (const corrupted of ['123', 'null', '{"a":1}', '"text"', '[1,2,3]', '[{"x":1}]']) {
        mem.setItem('favorites', corrupted)
        expect(() => readJSON<string[]>('favorites', [], isStringArray)).not.toThrow()
        const value = readJSON<string[]>('favorites', [], isStringArray)
        expect(value).toEqual([])
        // クラッシュの原因だった Array 前提の操作が安全に行えること
        expect(() => value.includes('running')).not.toThrow()
      }

      mem.setItem('favorites', '["running","yoga"]')
      expect(readJSON<string[]>('favorites', [], isStringArray)).toEqual(['running', 'yoga'])
    })

    it('lastAnswers: rejects a number, null, missing constraints, and non-numeric answers', async () => {
      const mem = new MemoryStorage()
      vi.stubGlobal('window', { localStorage: mem })
      const { readJSON } = await import('./storage')
      const { isSavedDiagnosis } = await import('./savedDiagnosis')

      const corruptedValues = [
        '123',
        'null',
        '"hello"',
        '[]',
        '{"a":1}', // answers も constraints もない
        '{"answers":{"q1":0}}', // constraints 欠落
        '{"answers":{"q1":"zero"},"constraints":{"budget":"under5000","time":"under2h","region":"東京都"}}', // answers の値が数値でない
        '{"answers":{"q1":0},"constraints":{"budget":"invalid","time":"under2h","region":"東京都"}}', // budget が不正
        '{"answers":{"q1":0},"constraints":{"budget":"under5000","time":"under2h"}}', // region 欠落
      ]
      for (const corrupted of corruptedValues) {
        mem.setItem('last', corrupted)
        expect(() => readJSON('last', null, isSavedDiagnosis)).not.toThrow()
        expect(readJSON('last', null, isSavedDiagnosis)).toBeNull()
      }

      mem.setItem(
        'last',
        '{"answers":{"q1":0,"q2":3},"constraints":{"budget":"under5000","time":"under2h","region":"東京都"}}',
      )
      const saved = readJSON('last', null, isSavedDiagnosis)
      expect(saved).not.toBeNull()
      // クラッシュの原因だった参照が安全に行えること
      expect(saved!.constraints.region).toBe('東京都')
    })
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

  it('readJSON returns the fallback when localStorage.getItem throws (e.g. SecurityError)', async () => {
    const throwingGet: Storage = {
      length: 0,
      clear: () => {},
      getItem: () => {
        throw new Error('SecurityError')
      },
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    }
    vi.stubGlobal('window', { localStorage: throwingGet })
    const { readJSON } = await import('./storage')
    expect(readJSON('x', 'fb', anyValue)).toBe('fb')
  })
})
