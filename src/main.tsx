import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Single global stylesheet: fonts + design tokens + shared keyframes +
// base reset. Everything else is colocated *.module.css per component.
import './styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
