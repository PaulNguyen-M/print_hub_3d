import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ChatWidget from '../components/chat/ChatWidget'
import useAuthStore from '../store/authStore'

export default function MainLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  // Remount the chat widget (fresh state + new WebSocket) when the account changes
  const chatUserKey = useAuthStore((s) => s.user?.id ?? 'anon')

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className={`flex-1 ${isHome ? '' : 'pt-16'}`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>

      <Footer />
      <ChatWidget key={chatUserKey} />
    </div>
  )
}
