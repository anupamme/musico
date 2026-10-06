const BILLBOARD_200_URL = 'https://ca.billboard.com/charts/billboard-200'

export interface ChartAlbum {
  rank: number
  name: string
  artist: string
}

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim()

const sanitizeChartLine = (value: string) =>
  normalizeWhitespace(decodeHtmlEntities(value.replace(/<[^>]+>/g, ' ')))

export const parseBillboard200Albums = (html: string, limit = 12): ChartAlbum[] => {
  // Scope fields to a chart row: historical positions and weeks are also numbers.
  const rows = html.split(/<div\b[^>]*class=["']chart-item["'][^>]*>/i).slice(1)
  const entries: ChartAlbum[] = []
  const seenRanks = new Set<number>()

  for (const row of rows) {
    const position = row.match(/<div\b[^>]*class=["']chart-item-position["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]
    const headline = row.match(/<h2\b[^>]*class=["']chart-item-headline["'][^>]*>([\s\S]*?)<\/h2>/i)?.[1]
    const subheadline = row.match(/<h3\b[^>]*class=["']chart-item-subheadline["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1]
    const rank = Number(position?.trim())
    const name = sanitizeChartLine(headline ?? '')
    const artist = sanitizeChartLine(subheadline ?? '')
    if (!Number.isInteger(rank) || rank < 1 || rank > 200 || seenRanks.has(rank) || !name || !artist) continue
    entries.push({ rank, name, artist })
    seenRanks.add(rank)
  }

  if (!entries.length) throw new Error('Billboard 200 chart returned no parsable albums.')
  return entries.sort((a, b) => a.rank - b.rank).slice(0, limit)
}

export const fetchBillboard200Albums = async (limit = 12) => {
  const response = await fetch(BILLBOARD_200_URL, {
    headers: {
      'User-Agent': 'musico/1.0 (+https://musico.local)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`Billboard chart request failed: ${response.status}`)
  }

  const html = await response.text()
  return parseBillboard200Albums(html, limit)
}
