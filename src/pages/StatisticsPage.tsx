import { useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import { useTvDataContext } from '../context/TvDataContext'
import { StatsBar } from '../components/StatsBar'
import { ChartsSection } from '../components/ChartsSection'

export function StatisticsPage() {
  const { data, loading, error, refetch } = useTvDataContext()
  const [chartsOpen, setChartsOpen] = useState(true)

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" tip="Loading..." /></div>
  }
  if (error) {
    return <Alert type="error" message="Failed to load data" description={error} showIcon action={<Button size="small" onClick={refetch}>Retry</Button>} />
  }

  return (
    <>
      <StatsBar data={data} />
      <ChartsSection
        data={data}
        onFilter={() => {}}
        activeFilter={null}
        chartsOpen={chartsOpen}
        onChartsOpenChange={setChartsOpen}
      />
    </>
  )
}
