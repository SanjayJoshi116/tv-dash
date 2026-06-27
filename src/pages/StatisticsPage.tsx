import { useState } from 'react'
import { useTvDataContext } from '../context/TvDataContext'
import { StatsBar } from '../components/StatsBar'
import { ChartsSection } from '../components/ChartsSection'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function StatisticsPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const [chartsOpen, setChartsOpen] = useState(true)

  if (loading) return <LoadingState tip="Loading..." />
  if (error) return <ErrorState message="Failed to load data" description={error} onRetry={refetch} />

  return (
    <>
      <StatsBar data={data} />
      <ChartsSection
        data={data}
        chartsOpen={chartsOpen}
        onChartsOpenChange={setChartsOpen}
      />
    </>
  )
}
