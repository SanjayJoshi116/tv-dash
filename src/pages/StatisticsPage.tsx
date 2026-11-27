import { useTvDataContext } from '../context/useTvDataContext'
import { StatsBar } from '../components/StatsBar'
import { ChartsSection } from '../components/ChartsSection'
import { DataGate } from '../components/DataGate'

export function StatisticsPage() {
  const tvData = useTvDataContext()

  return (
    <DataGate state={tvData}>
      {data => (
        <>
          <StatsBar data={data} />
          <ChartsSection data={data} />
        </>
      )}
    </DataGate>
  )
}
