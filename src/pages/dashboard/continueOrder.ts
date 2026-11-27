import type { ContinueOrder } from '../../utils/showFilters'

// Continue Watching order options — per visit, not saved (ordering: showFilters continueWatching)
export const CONTINUE_ORDER_OPTIONS: { label: string; value: ContinueOrder }[] = [
  { label: 'Most watched', value: 'mostWatched' },
  { label: 'Least time left', value: 'leastTime' },
]
