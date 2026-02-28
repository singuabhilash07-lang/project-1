import React, { useEffect, useState } from 'react'
import { Search, MapPin, Calendar, User, Eye, Heart } from 'lucide-react'
import OTPModal from '../components/OTPModal'

export default function ItemsHub({ user, onEdit, onDelete }) {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [filter, setFilter] = useState('all') // all, lost, found
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [claimedCount, setClaimedCount] = useState(0)

  const categories = [
    'All',
    'Electronics',
    'Documents',
    'Jewelry',
    'Clothing',
    'Accessories',
    'Pets',
    'Other'
  ]

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      setItems(data || [])
      setFilteredItems(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching items:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    // recompute claimed count when items or user change
    if (!user) return
    const count = (items || []).filter(i => (i.ownerEmail === user.email || i.owner_email === user.email) && i.claimed).length
    setClaimedCount(count)
  }, [items, user])

  useEffect(() => {
    const handler = (e) => {
      const name = e?.detail?.name
      if (!name) return
      setItems(prev => prev.filter(i => i.name !== name))
      setFilteredItems(prev => prev.filter(i => i.name !== name))
      setClaimedCount(prev => Math.max(0, prev + 1))
    }
    window.addEventListener('item_claimed', handler)
    return () => window.removeEventListener('item_claimed', handler)
  }, [])

  useEffect(() => {
    let result = items

    // Filter by type (Lost/Found)
    if (filter !== 'all') {
      result = result.filter(item => {
        const itemType = item.type?.toLowerCase() || ''
        return itemType === filter
      })
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(item =>
        item.category?.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    setFilteredItems(result)
  }, [items, filter, searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold mb-2">Lost & Found Hub</h1>
            <p className="text-xl opacity-90">Help reunite items with their owners</p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Claimed items</div>
            <div className="text-2xl font-bold">{claimedCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by item name, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {['All', 'Lost', 'Found'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type.toLowerCase())}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  filter === type.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat.toLowerCase())}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-gray-600 mb-4">
          Showing <span className="font-bold text-gray-900">{filteredItems.length}</span> item{filteredItems.length !== 1 ? 's' : ''}
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-500 text-lg">No items found. Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <ItemCard
                key={idx}
                item={item}
                user={user}
                onSelect={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Item Details */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          user={user}
          onClose={() => setSelectedItem(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          onClaimed={(name) => {
            // remove claimed item from lists
            setItems(prev => prev.filter(i => i.name !== name))
            setFilteredItems(prev => prev.filter(i => i.name !== name))
            setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}

function ItemCard({ item, user, onSelect }) {
  const itemType = item.type?.toLowerCase() || 'unknown'
  const isLost = itemType === 'lost'
  const isOwner = user && (user.email === item.ownerEmail || user.email === item.owner_email)

  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
    >
      {/* Header with Badge */}
      <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-white text-sm font-bold ${
          isLost ? 'bg-red-500' : 'bg-green-500'
        }`}>
          {isLost ? '🔍 Lost' : '✓ Found'}
        </div>
        {item.image ? (
          <img src={item.image} alt="attached" className="object-cover w-full h-full" />
        ) : (
          <div className="text-6xl">
            {getEmojiForCategory(item.category || 'other')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          {item.location && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}

          {item.date && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar size={16} className="text-blue-600 flex-shrink-0" />
              <span>{formatDate(item.date)}</span>
            </div>
          )}

          {item.ownerEmail || item.owner_email && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User size={16} className="text-blue-600 flex-shrink-0" />
              <span className="truncate">{item.ownerEmail || item.owner_email}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 items-center">
          {isOwner ? (
            <span className="text-sm text-gray-500">Your listing</span>
          ) : (
            <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm">
              View Details
            </button>
          )}
          <button className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            <Heart size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ItemDetailModal({ item, onClose, user, onEdit, onDelete, onClaimed }) {
  const itemType = item.type?.toLowerCase() || 'unknown'
  const isLost = itemType === 'lost'
  const isOwner = user && (user.email === item.ownerEmail || user.email === item.owner_email)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otp, setOtp] = useState('')

  const handleClaim = async () => {
    try {
      const res = await fetch(`/api/item/claim/${encodeURIComponent(item.name)}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Claim failed')
      if (data.otp) {
        alert(data.message + '\n\nOTP (for testing): ' + data.otp)
      } else {
        alert(data.message)
      }
      if (document && document.activeElement) document.activeElement.blur()
      setOtpModalOpen(true)
    } catch (err) {
      alert('Network error')
    }
  }

  const handleVerify = async (value) => {
    try {
      const res = await fetch(`/api/item/verify/${encodeURIComponent(item.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: value })
      })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Verify failed')
      alert(data.message)
      setOtpModalOpen(false)
      // notify parent that item was claimed so UI can remove it
      if (typeof onClaimed === 'function') onClaimed(item.name)
      onClose()
    } catch (err) {
      alert('Network error')
    }
  }

  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {item.image && (
          <div className="w-full h-64 bg-gray-100 overflow-hidden">
            <img src={item.image} className="object-cover w-full h-full" alt="attachment" />
          </div>
        )}
        {/* Header */}
        <div className={`${isLost ? 'bg-red-50' : 'bg-green-50'} border-b-2 ${isLost ? 'border-red-200' : 'border-green-200'} p-6 flex justify-between items-center`}>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{item.name}</h2>
            <p className={`text-sm font-semibold mt-1 ${isLost ? 'text-red-600' : 'text-green-600'}`}>
              {isLost ? '🔍 Lost Item' : '✓ Found Item'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Category & Type */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Category</p>
              <p className="text-gray-900 font-bold text-lg mt-1">{item.category || 'Not specified'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 text-sm font-semibold">Type</p>
              <p className="text-gray-900 font-bold text-lg mt-1">{item.type || 'Unknown'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed text-base">{item.description}</p>
          </div>

          {/* Location & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {item.location && (
              <div>
                <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <MapPin size={16} /> Location
                </h3>
                <p className="text-gray-900 font-semibold">{item.location}</p>
              </div>
            )}

            {item.date && (
              <div>
                <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                  <Calendar size={16} /> Date
                </h3>
                <p className="text-gray-900 font-semibold">{formatDate(item.date)}</p>
              </div>
            )}
          </div>

          {/* Owner Info */}
          {(item.ownerEmail || item.owner_email || item.mobile || item.altMobile) && (
            <div className="mb-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                <User size={16} /> Contact Owner
              </h3>
              {item.ownerEmail && (
                <p className="text-gray-900 font-semibold text-lg">Email: {item.ownerEmail}</p>
              )}
              {item.mobile && (
                <p className="text-gray-900">Mobile: {item.mobile}</p>
              )}
              {item.altMobile && (
                <p className="text-gray-900">Alt mobile: {item.altMobile}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {isOwner ? (
              <>
                <button
                  onClick={() => {
                    if (onEdit) onEdit(item)
                    onClose()
                  }}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (onDelete) onDelete(item)
                    onClose()
                  }}
                  className="flex-1 py-3 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                onClick={handleClaim}
                className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors ${
                  isLost
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLost ? 'Claim This Item' : 'I Found This'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    {otpModalOpen && (
      <OTPModal
        open={otpModalOpen}
        otpValue={otp}
        setOtp={setOtp}
        onClose={() => setOtpModalOpen(false)}
        onVerify={handleVerify}
      />
    )}
    </>
  )
}

function getEmojiForCategory(category) {
  const emojis = {
    electronics: '📱',
    documents: '📄',
    jewelry: '💎',
    clothing: '👕',
    accessories: '🎒',
    pets: '🐕',
    other: '🎁'
  }
  return emojis[category?.toLowerCase()] || emojis.other
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
