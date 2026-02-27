import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

export default function Profile({ user, setView }) {
  if (!user) {
    return <Box sx={{ p:4 }}>No user data. Please register.</Box>
  }

  return (
    <Box sx={{ p:4, maxWidth: 600, mx: 'auto' }}>
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
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
