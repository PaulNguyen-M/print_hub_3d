import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode removed: causes WebGL Context Lost in dev due to double-mounting R3F Canvas
createRoot(document.getElementById('root')!).render(
  <App />
)
