import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Điểm khởi động ứng dụng: mount <App /> vào #root.
// Bỏ StrictMode: gây "WebGL Context Lost" ở dev do R3F Canvas bị mount 2 lần.
createRoot(document.getElementById('root')!).render(
  <App />
)
