import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

export default function Profile({ user, setView, setUser }) {
  if (!user) {
    return <Box sx={{ p:4 }}>No user data. Please register.</Box>
  }

  const dismissNotification = (index) => {
    const remaining = (user.notifications || []).filter((_, i) => i !== index)
    const newUser = { ...user, notifications: remaining }
    setUser && setUser(newUser)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  return (
    <Box sx={{ p:4, maxWidth: 600, mx: 'auto' }}>
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

      {user.notifications && user.notifications.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex justify-between items-center">
              <span className="font-semibold">You have {user.notifications.length} notification{user.notifications.length>1? 's':''}</span>
              <Button size="small" onClick={async () => {
                try {
                  await fetch('/api/user/notifications/clear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                  })
                  const newUser = { ...user, notifications: [] }
                  setUser && setUser(newUser)
                  localStorage.setItem('user', JSON.stringify(newUser))
                } catch (e) {}
              }}>Clear all</Button>
            </div>
            {user.notifications.map((n, i) => (
              <div key={i} className="mt-2 p-2 border rounded bg-white">
                <div className="text-sm font-bold">{n.name} ({n.type})</div>
                <div className="text-xs text-gray-700">{n.message}</div>
                <div className="text-xs text-gray-500">Match Score: {n.matchScore}%</div>
                <div className="mt-2">
                  <Button size="small" variant="contained" onClick={() => setView('history')}>View Item</Button>
                  <Button size="small" onClick={() => dismissNotification(i)} sx={{ ml: 1 }}>Dismiss</Button>
                </div>
              </div>
            ))}
          </div>
        </Box>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-600">Name</p>
          <p className="text-lg text-gray-900">{user.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-600">Email</p>
          <p className="text-lg text-gray-900">{user.email}</p>
        </div>
      </div>
      <Box sx={{ mt: 6 }}>
        <Button variant="contained" onClick={() => setView('history')}>View History</Button>
      </Box>
    </Box>
  )
}
