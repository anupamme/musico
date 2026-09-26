import {
  getHomeSections,
  patchHomeSectionsCommunityStats,
  updateAlbumCommunityStatsInCache,
} from '../services/discogsService.js'

// Fetch a larger set than the page initially displays so client-side
// pagination works without additional API calls.
const HOME_SECTION_FETCH_LIMIT = 24

export const homeSectionsQueryOptions = {
  queryKey: ['home-sections', HOME_SECTION_FETCH_LIMIT, HOME_SECTION_FETCH_LIMIT],
  queryFn: ({ signal }) =>
    getHomeSections({
      happeningLimit: HOME_SECTION_FETCH_LIMIT,
      recentLimit: HOME_SECTION_FETCH_LIMIT,
      signal,
    }),
  staleTime: 1000 * 60 * 5,
}

export const updateHomeSectionsCommunityStats = async (queryClient, stats) => {
  const queryKey = homeSectionsQueryOptions.queryKey
  const wasFetching = queryClient.getQueryState(queryKey)?.fetchStatus === 'fetching'
  await queryClient.cancelQueries({ queryKey, exact: true })

  const patchCachedStats = () => {
    updateAlbumCommunityStatsInCache(stats)
    queryClient.setQueryData(queryKey, (current) => patchHomeSectionsCommunityStats(current, stats))
  }

  if (!queryClient.getQueryData(queryKey)) {
    updateAlbumCommunityStatsInCache(stats)
    void queryClient.invalidateQueries({ queryKey, exact: true })
    return
  }

  patchCachedStats()
  if (wasFetching) {
    try {
      await queryClient.invalidateQueries({ queryKey, exact: true, refetchType: 'all' })
    } finally {
      patchCachedStats()
    }
  }
}
