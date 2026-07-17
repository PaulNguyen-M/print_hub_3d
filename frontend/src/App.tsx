import AppProviders from './providers/AppProviders'
import AppRoutes from './routes/AppRoutes'

/** App — Component gốc: bọc toàn bộ provider (AppProviders) quanh bảng định tuyến (AppRoutes). */
function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}

export default App
