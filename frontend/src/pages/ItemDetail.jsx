import React, { useState, useEffect } from 'react'
import { MapPin, Calendar, User, Mail, Phone, Share2, Heart, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function ItemDetail({ itemId }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    // In a real app, fetch item by ID
    // For now, we'll use localStorage or props
  }, [itemId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Image Section */}
      <div className="h-96 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
        <div className="text-9xl">📦</div>
      </div>

      {/* Content Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 mb-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-block px-4 py-2 bg-red-100 text-red-700 rounded-full font-bold text-sm mb-4">
                    🔍 Lost Item
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900">iPhone 14 Pro Max</h1>
                  <p className="text-gray-600 mt-2">Electronics • Lost on Feb 20, 2026</p>
                </div>
                <button className={`p-3 rounded-full ${liked ? 'bg-red-100' : 'bg-gray-100'} hover:bg-red-100 transition-colors`}>
                  <Heart size={24} className={liked ? 'fill-red-600 text-red-600' : 'text-gray-600'} />
                </button>
              </div>

              {/* Description Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  Silver iPhone 14 Pro Max with a slightly cracked screen on the top right. Has a blue protective case with a silver Apple logo. Battery health around 85%. Contains important work documents and personal photos. Last seen around 3:30 PM at the central train station.
                </p>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b-2 border-gray-200">
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">CATEGORY</p>
                  <p className="text-gray-900 font-bold text-lg">Electronics</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">ITEM CONDITION</p>
                  <p className="text-gray-900 font-bold text-lg">Slightly Damaged</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">VALUE</p>
                  <p className="text-gray-900 font-bold text-lg">~$1,099</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm font-semibold mb-2">POSTED</p>
                  <p className="text-gray-900 font-bold text-lg">2 days ago</p>
                </div>
              </div>

              {/* Location & Date */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                    <MapPin size={24} className="text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">LOCATION</p>
                      <p className="text-gray-900 font-bold text-lg">Central Train Station, Platform 5</p>
                      <p className="text-gray-600 text-sm mt-1">City, State 12345</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    <Calendar size={24} className="text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-600">DATE LOST</p>
                      <p className="text-gray-900 font-bold text-lg">February 20, 2026</p>
                      <p className="text-gray-600 text-sm mt-1">Around 3:30 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Similar Items */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Similar Items</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map(i => (
                    <div key={i} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-600 transition-colors cursor-pointer">
                      <div className="flex gap-4">
                        <div className="text-5xl">📦</div>
                        <div>
                          <h3 className="font-bold text-gray-900">iPhone 14 Pro</h3>
                          <p className="text-sm text-gray-600">Found • 3 days ago</p>
                          <p className="text-sm text-blue-600 mt-1">Central Market</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Owner Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Contact Owner</h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                  JD
                </div>
                <div>
                  <p className="font-bold text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">Verified Owner</p>
                </div>
              </div>

              {/* Contact Methods */}
              <div className="space-y-3 mb-6 pb-6 border-b-2 border-gray-200">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  <Mail size={20} />
                  Email Owner
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors">
                  <MessageCircle size={20} />
                  Message
                </button>
              </div>

              {/* Verification Badge */}
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-green-700">✓ Verified Owner</p>
                <p className="text-xs text-gray-600 mt-2">This owner has verified their contact information</p>
              </div>
            </div>

            {/* Report Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Problem with this listing?</h3>
              <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors">
                Report Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
