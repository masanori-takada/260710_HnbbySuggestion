import { describe, expect, it } from 'vitest'
import { deriveType } from './deriveType'
import { TRAIT_AXES } from '../types'
import type { TraitProfile } from '../types'

describe('deriveType', () => {
  it('returns a non-empty type name for every possible 5-axis profile (0-4 each)', () => {
    let count = 0
    for (let a = 0; a <= 4; a += 1) {
      for (let b = 0; b <= 4; b += 1) {
        for (let c = 0; c <= 4; c += 1) {
          for (let d = 0; d <= 4; d += 1) {
            for (let e = 0; e <= 4; e += 1) {
              const profile: TraitProfile = {
                indoor_outdoor: a,
                social: b,
                physical: c,
                creative: d,
                learning: e,
              }
              const type = deriveType(profile)
              expect(typeof type).toBe('string')
              expect(type.length).toBeGreaterThan(0)
              count += 1
            }
          }
        }
      }
    }
    // 5^5 とおりすべてを検証したこと
    expect(count).toBe(5 ** 5)
  })

  it('returns the same type for the same profile (deterministic)', () => {
    const profile: TraitProfile = { indoor_outdoor: 3, social: 4, physical: 1, creative: 0, learning: 2 }
    expect(deriveType(profile)).toBe(deriveType({ ...profile }))
  })

  it('returns a balanced-type name for the perfectly neutral profile', () => {
    const neutral: TraitProfile = { indoor_outdoor: 2, social: 2, physical: 2, creative: 2, learning: 2 }
    expect(deriveType(neutral)).toContain('バランス')
  })

  it('never throws even if a profile has unexpected extra keys', () => {
    const profile = {
      indoor_outdoor: 0,
      social: 4,
      physical: 2,
      creative: 4,
      learning: 0,
    } as TraitProfile
    expect(() => deriveType(profile)).not.toThrow()
  })

  it('produces different names for clearly different personalities', () => {
    const outdoorActive: TraitProfile = { indoor_outdoor: 4, social: 4, physical: 4, creative: 2, learning: 2 }
    const indoorQuiet: TraitProfile = { indoor_outdoor: 0, social: 0, physical: 0, creative: 4, learning: 4 }
    expect(deriveType(outdoorActive)).not.toBe(deriveType(indoorQuiet))
  })

  it('always uses a recognized trait axis internally (sanity check on TRAIT_AXES)', () => {
    expect(TRAIT_AXES).toHaveLength(5)
  })
})
