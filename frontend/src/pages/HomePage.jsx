import React, { useState } from 'react'
import { Heart, MapPin, Search, Shield, Zap, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import ItemsHub from './ItemsHub'
import History from './History'
import Profile from './Profile'
import ReportPage from './ReportPage'

export default function HomePage() {
  const [view, setView] = useState('landing')

  React.useEffect(() => {
    if (view === 'how' || view === 'landing') {
      // scroll down to how-it-works section when requested
      setTimeout(() => {
        const el = document.getElementById('how-it-works')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [view])
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [reportType, setReportType] = useState(null)
  const [editItem, setEditItem] = useState(null)

  const openReport = (type) => {
    if (!user) {
      alert('Please register first')
      setView('landing')
      return
    }
    setEditItem(null)
    setReportType(type)
    setView('report')
  }

  const startEdit = (item) => {
    setEditItem(item)
    setReportType(item.type)
    setView('report')
  }

  const handleDeleteItem = async (item) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to delete this item?')) return
    try {
      const res = await fetch(`/api/item/delete/${encodeURIComponent(item.name)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerEmail: user.email })
      })
      const data = await res.json()
      alert(data.message)
      setView('history')
    } catch (err) {
      alert('Network error')
    }
  }

  const closeReport = () => setReportType(null)

  const handleReportSuccess = () => {
    setView('history')
  }

  // render different sections based on view
  if (view === 'report') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} setUser={setUser} onNavigate={setView} onOpenReport={openReport} />
        <ReportPage
          type={reportType}
          user={user}
          existing={editItem}
          onSuccess={handleReportSuccess}
          onCancel={() => setView('landing')}
        />
      </div>
    )
  }

  if (view === 'hub') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} setUser={setUser} onNavigate={setView} onOpenReport={openReport} />
        <ItemsHub user={user} onEdit={startEdit} onDelete={handleDeleteItem} />
      </div>
    )
  }

  if (view === 'history') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} setUser={setUser} onNavigate={setView} onOpenReport={openReport} />
        <History user={user} onEdit={startEdit} onDelete={handleDeleteItem} />
      </div>
    )
  }

  if (view === 'profile') {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} setUser={setUser} onNavigate={setView} onOpenReport={openReport} />
        <Profile user={user} setView={setView} />
      </div>
    )
  }

  // default landing page
  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} setUser={setUser} onNavigate={setView} onOpenReport={openReport} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
                Lost Something?
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600"> Find It Here</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                UnLost connects lost and found items with their owners. Report a lost item, browse found items, or help reunite others with what they've lost.
              </p>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => setView('hub')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                  Browse Items
                </button>
                <button
                  onClick={() => openReport('lost')}
                  className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all"
                >
                  Report Lost Item
                </button>
                <button
                  onClick={() => openReport('found')}
                  className="px-8 py-4 border-2 border-yellow-400 text-yellow-600 rounded-xl font-bold text-lg hover:bg-yellow-50 transition-all"
                >
                  Report Found Item
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                {[
                  { num: '5.2K+', label: 'Items Listed' },
                  { num: '89%', label: 'Found Rate' },
                  { num: '12K+', label: 'Community Members' }
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-white bg-opacity-50 backdrop-blur-md rounded-xl border border-white border-opacity-20">
                    <p className="text-3xl font-bold text-gray-900">{stat.num}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl shadow-2xl flex items-center justify-center">
                <div className="text-9xl animate-bounce">🔍</div>
              </div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-300 rounded-3xl shadow-lg flex items-center justify-center -z-10">
                <div className="text-8xl">📦</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple steps to find or report lost items</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '📝',
                title: 'Report',
                description: 'Post details about your lost or found item including photos, description, and location.'
              },
              {
                icon: '🔍',
                title: 'Search',
                description: 'Browse through our database of lost and found items. Use filters and search to find matches.'
              },
              {
                icon: '📞',
                title: 'Connect',
                description: 'Contact the item owner or claimant directly. Verify ownership and arrange handover safely.'
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 h-full">
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-lg">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 transform translate-x-12 -translate-y-1/2 text-3xl text-blue-600">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* rest unchanged... */}

    </div>
  )
}
