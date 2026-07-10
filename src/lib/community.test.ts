import { describe, expect, it } from 'vitest'
import { buildCommunityLinks } from './community'
import { REGIONS } from '../data/regions'
import type { Hobby } from '../types'

function makeHobby(overrides: Partial<Hobby> = {}): Hobby {
  return {
    id: 'test-hobby',
    name: 'ボルダリング',
    category: 'スポーツ',
    description: 'テスト用のダミー趣味です。',
    profile: { indoor_outdoor: 2, social: 2, physical: 2, creative: 2, learning: 2 },
    initialCostMin: 1000,
    initialCostMax: 3000,
    monthlyCost: 500,
    weeklyHours: 2,
    gear: ['道具A'],
    firstSteps: ['ステップ1', 'ステップ2', 'ステップ3'],
    communityKeywords: ['ボルダリング', 'クライミング'],
    indoor: true,
    starterKit: {
      free: { description: '無料で試す', cost: 0 },
      budget: { description: 'お試しセット', cost: 3000 },
      full: { description: '本格スタートセット', cost: 10000 },
    },
    ...overrides,
  }
}

describe('buildCommunityLinks', () => {
  it('returns a link for each expected community source', () => {
    const links = buildCommunityLinks('東京都', makeHobby())
    const labels = links.map((l) => l.label)
    expect(labels).toEqual(
      expect.arrayContaining(['ジモティー', 'こくちーずプロ', 'Google マップ', 'X(旧Twitter)']),
    )
    expect(links).toHaveLength(4)
  })

  it('every link is a well-formed https URL', () => {
    const links = buildCommunityLinks('大阪府', makeHobby())
    for (const link of links) {
      expect(() => new URL(link.url)).not.toThrow()
      expect(link.url.startsWith('https://')).toBe(true)
    }
  })

  it('encodes region and hobby name so special characters are safe', () => {
    const hobby = makeHobby({ name: 'C++ & プログラミング/アート', communityKeywords: ['C++ & プログラミング/アート'] })
    const links = buildCommunityLinks('東京都', hobby)
    for (const link of links) {
      // 生の "&" や "/" がクエリ構造を壊す形でそのまま残っていないこと
      expect(link.url).not.toContain('プログラミング/アート')
      expect(link.url).toContain(encodeURIComponent('C++ & プログラミング/アート').slice(0, 10))
    }
  })

  it('never throws and always includes the region for all 47 prefectures', () => {
    const hobby = makeHobby()
    for (const region of REGIONS) {
      const links = buildCommunityLinks(region, hobby)
      expect(links).toHaveLength(4)
      for (const link of links) {
        expect(link.url).toContain(encodeURIComponent(region))
      }
    }
  })

  it('handles an empty region and empty hobby name without throwing', () => {
    const hobby = makeHobby({ name: '', communityKeywords: [] })
    expect(() => buildCommunityLinks('', hobby)).not.toThrow()
    const links = buildCommunityLinks('', hobby)
    expect(links).toHaveLength(4)
  })

  it('uses the hobby name (not just category) inside the Google Maps search query', () => {
    const hobby = makeHobby({ name: '陶芸' })
    const links = buildCommunityLinks('京都府', hobby)
    const maps = links.find((l) => l.label === 'Google マップ')
    expect(maps).toBeDefined()
    expect(maps!.url).toContain(encodeURIComponent('陶芸'))
    expect(maps!.url).toContain(encodeURIComponent('京都府'))
  })
})
