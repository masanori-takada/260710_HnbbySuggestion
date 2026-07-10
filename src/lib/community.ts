import type { Hobby } from '../types'

export interface CommunityLink {
  label: string
  description: string
  url: string
}

/**
 * 都道府県と趣味情報から、地域コミュニティ探しに使える検索リンクを生成する純関数。
 * すべてのクエリパラメータは encodeURIComponent で組み立てる。
 */
export function buildCommunityLinks(region: string, hobby: Hobby): CommunityLink[] {
  const keyword = hobby.communityKeywords[0] || hobby.name
  const regionAndHobby = `${region} ${hobby.name}`.trim()
  const regionAndKeyword = `${region} ${keyword}`.trim()

  return [
    {
      label: 'ジモティー',
      description: '地域のサークル・メンバー募集を探す',
      url: `https://www.jmty.jp/search?keyword=${encodeURIComponent(regionAndKeyword)}`,
    },
    {
      label: 'こくちーずプロ',
      description: '地域のイベント・勉強会・教室を探す',
      url: `https://www.kokuchpro.com/search/?keyword=${encodeURIComponent(regionAndKeyword)}`,
    },
    {
      label: 'Google マップ',
      description: '近くの教室・スポットを地図で探す',
      url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${regionAndHobby} 教室`)}`,
    },
    {
      label: 'X(旧Twitter)',
      description: '最新の話題や仲間を検索する',
      url: `https://x.com/search?q=${encodeURIComponent(regionAndHobby)}&src=typed_query`,
    },
  ]
}
