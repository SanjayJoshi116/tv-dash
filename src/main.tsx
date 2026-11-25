import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { RootErrorBoundary } from './components/RootErrorBoundary'
import { consumeResetParam } from './utils/settings'

// `?reset` escape hatch: clear saved settings before anything reads them
consumeResetParam()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('#root element missing in index.html')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
)
