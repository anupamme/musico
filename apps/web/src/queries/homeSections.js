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
  await queryClient.cancelQueries({ queryKey: homeSectionsQueryOptions.queryKey, exact: true })
  updateAlbumCommunityStatsInCache(stats)

  if (!queryClient.getQueryData(homeSectionsQueryOptions.queryKey)) {
    void queryClient.invalidateQueries({ queryKey: homeSectionsQueryOptions.queryKey, exact: true })
    return
  }

  queryClient.setQueryData(homeSectionsQueryOptions.queryKey, (current) =>
    patchHomeSectionsCommunityStats(current, stats),
  )
}
