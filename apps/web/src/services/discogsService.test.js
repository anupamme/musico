import test from 'node:test'
import assert from 'node:assert/strict'
import { QueryClient } from '@tanstack/react-query'

import api from './apiClient.js'
import { getHomeSections, updateAlbumCommunityStatsInCache } from './discogsService.js'
import { homeSectionsQueryOptions, updateHomeSectionsCommunityStatsInQuery } from '../queries/homeSections.js'

const album = {
  id: 'm:1',
  name: 'Album',
  artists: ['Artist'],
  cover: null,
  releaseYear: 2025,
}

test('re-fetches home sections after a partial failure', async () => {
  const originalAdapter = api.defaults.adapter
  let calls = 0
  api.defaults.adapter = async (config) => {
    calls += 1
    return {
      data: calls === 1
        ? {
            mostHappening: { data: [], error: 'Unable to load most happening albums.' },
            recentReleases: { data: [album], error: null },
          }
        : {
            mostHappening: { data: [album], error: null },
            recentReleases: { data: [album], error: null },
          },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await getHomeSections()
    const result = await getHomeSections()
    assert.equal(calls, 2)
    assert.deepEqual(result.mostHappening.data, [album])

    updateAlbumCommunityStatsInCache({ albumId: album.id, communityRating: 4.5, reviewCount: 2 })
    const cached = await getHomeSections()
    assert.equal(calls, 2)
    assert.equal(cached.mostHappening.data[0].communityRating, 4.5)
    assert.equal(cached.recentReleases.data[0].reviewCount, 2)
  } finally {
    api.defaults.adapter = originalAdapter
  }
})

test('updates both visible homepage query sections after community stats change', () => {
  const queryClient = new QueryClient()
  const otherAlbum = { ...album, id: 'm:2' }
  const original = {
    mostHappening: { data: [album, otherAlbum], error: null },
    recentReleases: { data: [album], error: null },
  }
  queryClient.setQueryData(homeSectionsQueryOptions.queryKey, original)

  updateHomeSectionsCommunityStatsInQuery(queryClient, {
    albumId: album.id,
    communityRating: 4.5,
    reviewCount: 2,
  })

  const updated = queryClient.getQueryData(homeSectionsQueryOptions.queryKey)
  assert.equal(updated.mostHappening.data[0].communityRating, 4.5)
  assert.equal(updated.recentReleases.data[0].reviewCount, 2)
  assert.deepEqual(updated.mostHappening.data[1], otherAlbum)
  assert.equal(original.mostHappening.data[0].communityRating, undefined)
})
