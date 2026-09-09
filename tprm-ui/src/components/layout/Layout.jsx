import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ChatWidget from '@/components/chat/ChatWidget'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">Third-Party Risk Management Intelligence Platform</div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
            Live
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <ChatWidget />
    </div>
  )
}
