import { useTvDataContext } from '../context/useTvDataContext'
import { StatsBar } from '../components/StatsBar'
import { ChartsSection } from '../components/ChartsSection'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function StatisticsPage() {
  const { data, loading, error, refetch } = useTvDataContext()

  if (loading) return <LoadingState />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  return (
    <>
      <StatsBar data={data} />
      <ChartsSection data={data} />
    </>
  )
}
