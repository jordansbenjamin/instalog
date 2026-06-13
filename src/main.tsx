import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
// Single global stylesheet: fonts + design tokens + shared keyframes +
// base reset. Everything else is colocated *.module.css per component.
import './styles/index.css'
import App from './App.tsx'
import { ErrorFallback } from './components/ErrorFallback.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
