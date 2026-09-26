import { getHomeSections, patchHomeSectionsCommunityStats } from '../services/discogsService.js'

// Fetch a larger set than the page initially displays so client-side
// pagination works without additional API calls.
const HOME_SECTION_FETCH_LIMIT = 24

export const homeSectionsQueryOptions = {
  queryKey: ['home-sections', HOME_SECTION_FETCH_LIMIT, HOME_SECTION_FETCH_LIMIT],
  queryFn: () =>
    getHomeSections({
      happeningLimit: HOME_SECTION_FETCH_LIMIT,
      recentLimit: HOME_SECTION_FETCH_LIMIT,
    }),
  staleTime: 1000 * 60 * 5,
}

export const updateHomeSectionsCommunityStatsInQuery = (queryClient, stats) => {
  queryClient.setQueryData(homeSectionsQueryOptions.queryKey, (current) =>
    patchHomeSectionsCommunityStats(current, stats),
  )
}
