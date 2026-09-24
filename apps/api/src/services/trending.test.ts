import { expect, test } from 'bun:test'

import { matchBillboardAlbums } from './trending'

test('keeps only current Billboard matches when the chart is shorter than the requested limit', async () => {
  const result = await matchBillboardAlbums(
    [
      { rank: 1, artist: 'Daft Punk', name: 'Discovery' },
      { rank: 2, artist: 'Missing Artist', name: 'Missing Album' },
    ],
    async (query) => ({
      data: query.includes('Daft Punk')
        ? [{ id: 'm:1', name: 'Discovery', artists: ['Daft Punk'], popularity: 1, reviewCount: 0 }]
        : [],
    }),
    24,
  )

  expect(result.map((release) => release.id)).toEqual(['m:1'])
})

test('reads the latest snapshot in a single SQL statement scoped to its section', async () => {
  const script = `
    import { mock } from 'bun:test'
    import { drizzle } from 'drizzle-orm/pg-proxy'
    const queries = []
    const db = drizzle(async (sql, params) => {
      queries.push({ sql, params })
      return { rows: [] }
    })
    mock.module('./src/core/db.ts', () => ({ db }))
    const { getStoredTrendingAlbums } = await import('./src/services/trending.ts')
    const result = await getStoredTrendingAlbums(12, 'recent-popular')
    console.log(JSON.stringify({ result, queries }))
  `
  const child = Bun.spawn([process.execPath, '--eval', script], {
    cwd: new URL('../..', import.meta.url).pathname,
    stdout: 'pipe', stderr: 'pipe',
  })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ])
  expect(stderr).toBe('')
  expect(exitCode).toBe(0)
  const { result, queries } = JSON.parse(stdout)
  expect(result).toEqual([])
  expect(queries).toHaveLength(1)
  expect(queries[0].sql).toContain('= (select max(')
  expect(queries[0].sql).toContain('order by "stored_trending_album"."rank" asc limit')
  expect(queries[0].params).toEqual(['recent-popular', 'recent-popular', 12])
})
