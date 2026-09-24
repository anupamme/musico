import { useRef } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'

import AlbumGrid from '../components/album/AlbumGrid.jsx'
import PageTransition from '../components/ui/PageTransition.jsx'
import SearchBar from '../components/search/SearchBar.jsx'
import { useAuth } from '../hooks/useAuth.js'
import { searchReleases } from '../services/discogsService.js'
import { addToSearchHistory } from '../services/searchHistoryService.js'
import { recordSearchSignal } from '../services/searchSignalService.js'

const SearchResults = () => {
  const pageSize = 12
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  
  const query = searchParams.get('q')?.trim() ?? ''
  const lastLoggedQueryRef = useRef('')

  const {
    data,
    isPending,
    isFetchingNextPage,
    isFetchNextPageError,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['search-results', query, pageSize],
    queryFn: ({ pageParam, signal }) => searchReleases(query, { limit: pageSize, offset: pageParam, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.hasMore && lastPage.nextOffset != null
      ? lastPage.nextOffset
      : undefined,
    enabled: Boolean(query),
    staleTime: 5 * 60 * 1000,
  })
  const albums = data?.pages.flatMap((page) => page.data) ?? []
  const correctedQuery = data?.pages[0]?.correctedQuery ?? null

  const logSearch = (value) => {
    const trimmed = value?.trim() ?? ''
    if (!trimmed) return

    const normalized = trimmed.toLowerCase()
    if (lastLoggedQueryRef.current === normalized) return
    lastLoggedQueryRef.current = normalized
    void recordSearchSignal(trimmed)
  }

  // Handle Search Submission
  const handleSearch = (newQuery) => {
    const trimmed = newQuery?.trim() ?? ''
    if (trimmed) {
      addToSearchHistory(trimmed, user?.id ?? 'guest')
      logSearch(trimmed)
      
      const params = new URLSearchParams()
      params.set('q', trimmed)
      if (trimmed !== query) setSearchParams(params)
    } else {
      navigate('/discover')
    }
  }

  return (
    <PageTransition>
      <button
        type="button"
        onClick={() => navigate('/discover')}
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-muted hover:text-white tablet:tracking-[0.4em]"
      >
        <FiArrowLeft /> Back to Discover
      </button>

      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.45em] text-muted font-bold">Search Results</p>
          <h1 className="mt-2 break-words font-display text-3xl tablet:text-5xl font-bold tracking-tight">
            {query ? `“${query}”` : 'Start searching'}
          </h1>
        </div>

        <SearchBar
          query={query}
          onSearch={handleSearch}
          autoFocus={!query}
          historyScope={user?.id ?? 'guest'}
          enablePredictive={false}
        />

        {query && (
          <div className="mt-12">
            <AlbumGrid
              albums={albums}
              loading={isPending}
              error={data ? null : error?.message}
              correctedQuery={correctedQuery}
              onSelect={(id) => navigate(`/album/${id}`, { state: { from: '/search', query } })}
            />
            {isFetchNextPageError && (
              <p role="alert" className="mt-4 text-center text-sm text-red-300">
                {error?.message ?? 'Could not load more results.'} Please try again.
              </p>
            )}
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="rounded-full border border-outline px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:border-white/40 hover:bg-white/10 disabled:cursor-wait disabled:opacity-60"
                >
                  {isFetchingNextPage ? 'Loading' : isFetchNextPageError ? 'Retry Load More' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  )
}

export default SearchResults
