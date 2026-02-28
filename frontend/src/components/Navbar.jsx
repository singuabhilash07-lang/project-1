import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, Plus, Search as SearchIcon, Bell } from 'lucide-react'
import { io } from 'socket.io-client'
import RegisterModal from './RegisterModal'

export default function Navbar({ user, setUser, onNavigate, onOpenReport }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  const notifications = user?.notifications || []

  const socketRef = useRef(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    // cleanup existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (!user?.email) return

    const socket = io()
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join', { email: user.email })
      // fetch persisted notifications to sync state
      fetch(`/api/user/notifications?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const existing = user?.notifications || []
            const merged = [...data, ...existing]
            const newUser = { ...user, notifications: merged }
            try { localStorage.setItem('user', JSON.stringify(newUser)) } catch (e) {}
            setUser(newUser)
            setToast({ title: data[0].name || 'Match found', body: data[0].message || '' })
          }
        }).catch(() => {})
    })

    socket.on('notification', (payload) => {
      const incoming = payload?.notifications || (payload && (Array.isArray(payload) ? payload : [payload]))
      if (!incoming || incoming.length === 0) return
      const existing = user?.notifications || []
      const merged = [...incoming, ...existing]
      const newUser = { ...user, notifications: merged }
      try { localStorage.setItem('user', JSON.stringify(newUser)) } catch (e) {}
      setUser(newUser)
      // show toast for the first incoming notification
      try {
        if (incoming[0]) setToast({ title: incoming[0].name || 'Match found', body: incoming[0].message || '' })
      } catch (e) {}
    })

    socket.on('item_claimed', (payload) => {
      if (!payload) return
      const name = payload.name || payload.itemName || null
      if (!name) return
      try {
        window.dispatchEvent(new CustomEvent('item_claimed', { detail: { name } }))
      } catch (e) {}
      setToast({ title: 'Item claimed', body: `Item ${name} was claimed` })
    })

    socket.on('connect_error', (err) => {
      console.error('Socket connect_error', err)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.email])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const handleLogout = () => {
    localStorage.removeItem('user')
    setUser(null)
    setProfileMenuOpen(false)
    onNavigate('landing')
  }

  return (
    <>
      <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="text-3xl">🔍</div>
              <div>
                <h1 className="text-2xl font-bold">UnLost</h1>
                <p className="text-xs opacity-90">Lost & Found Platform</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => onNavigate('hub')} className="hover:opacity-80 transition-opacity font-semibold">
                Browse Items
              </button>
              <button onClick={() => onNavigate('how')} className="hover:opacity-80 transition-opacity font-semibold">
                How It Works
              </button>
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => onOpenReport('lost')}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Report Lost
              </button>
              <button
                onClick={() => onOpenReport('found')}
                className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Report Found
              </button>

              {!user && (
                <button
                  onClick={() => setRegisterOpen(true)}
                  className="border-2 border-white px-4 py-2 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition-all"
                >
                  Register
                </button>
              )}

              {user && (
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                        className="relative bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all"
                      >
                        <Bell size={20} />
                        <span className="absolute -top-2 -right-2 bg-white text-red-500 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {notifications.length}
                        </span>
                      </button>
                      {notificationsOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                          <div className="px-4 py-3 border-b bg-red-50 font-bold flex justify-between items-center">
                            <span>📬 {notifications.length} Match{notifications.length !== 1 ? 'es' : ''} Found!</span>
                            <button
                              className="text-xs text-blue-600 hover:underline"
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await fetch('/api/user/notifications/clear', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: user.email })
                                  })
                                  const newUser = { ...user, notifications: [] }
                                  setUser(newUser)
                                  try { localStorage.setItem('user', JSON.stringify(newUser)) } catch {}
                                } catch (err) {}
                              }}
                            >
                              Clear all
                            </button>
                          </div>
                          {notifications.map((notif, i) => (
                            <div key={i} className="px-4 py-3 border-b hover:bg-gray-50 cursor-pointer">
                              <div className="text-sm font-semibold text-blue-600">{notif.name}</div>
                              <div className="text-xs text-gray-600 mt-1">{notif.message}</div>
                              <div className="text-xs text-gray-500 mt-1">Match Score: {notif.matchScore}%</div>
                              <div className="text-xs text-gray-500">Type: {notif.type}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative">
                    <button
                      onClick={() => setProfileMenuOpen(prev => !prev)}
                      className="flex items-center gap-2 bg-white text-blue-600 px-3 py-1 rounded-full font-semibold"
                    >
                      <span className="uppercase">{user.name ? user.name[0] : user.email[0]}</span>
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                        <div className="px-4 py-3 border-b">
                          <p className="font-bold truncate">{user.name || 'Unknown'}</p>
                          <p className="text-xs truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { onNavigate('profile'); setProfileMenuOpen(false) }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => { onNavigate('history'); setProfileMenuOpen(false) }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          History
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-blue-400 pt-4">
              <button onClick={() => { onNavigate('hub'); setMobileMenuOpen(false)}} className="block hover:opacity-80 font-semibold">
                Browse Items
              </button>
              <button onClick={() => { onNavigate('how'); setMobileMenuOpen(false)}} className="block hover:opacity-80 font-semibold">
                How It Works
              </button>
              <button
                onClick={() => { onOpenReport('lost'); setMobileMenuOpen(false)}}
                className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 justify-center"
              >
                <Plus size={18} />
                Report Lost
              </button>
              <button
                onClick={() => { onOpenReport('found'); setMobileMenuOpen(false)}}
                className="w-full bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-300 transition-all flex items-center gap-2 justify-center"
              >
                <Plus size={18} />
                Report Found
              </button>
              {!user && (
                <button
                  onClick={() => { setRegisterOpen(true); setMobileMenuOpen(false)}}
                  className="w-full border-2 border-white px-4 py-2 rounded-lg font-bold hover:bg-white hover:text-blue-600 transition-all"
                >
                  Register
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg p-4 z-50 w-80">
          <div className="font-bold text-gray-900 truncate">{toast.title}</div>
          <div className="text-sm text-gray-600 mt-1">{toast.body}</div>
        </div>
      )}

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} onRegistered={setUser} />
    </>
  )
}

