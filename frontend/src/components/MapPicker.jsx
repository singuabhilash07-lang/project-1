import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

export default function MapPicker({ open, onClose, onSelectLocation }) {
  const [locationText, setLocationText] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setLocationText('')
      setAddress('')
    }
  }, [open])

  const getCurrentLocation = () => {
    setLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await reverseGeocode(latitude, longitude)
          setLoading(false)
        },
        (error) => {
          console.error('Geolocation error:', error.message)
          // Use numeric code constants for broader compatibility
          // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          if (error.code === 1) {
            alert('Location access denied. Enter location manually or enable geolocation in browser settings.')
          } else if (error.code === 2) {
            alert('Location unavailable. Try again or enter location manually.')
          } else if (error.code === 3) {
            alert('Getting location timed out. Try again or enter location manually.')
          } else {
            alert(`Unable to get location: ${error.message}`)
          }
          setLoading(false)
        }
      )
    } else {
      alert('Geolocation is not supported by your browser. Please search manually.')
      setLoading(false)
    }
  }

  const reverseGeocode = async (lat, lng) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const response = await fetch(
        `/api/geocode/reverse?lat=${lat}&lon=${lng}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)

      if (!response.ok) throw new Error('Reverse geocoding failed')
      const data = await response.json()
      setAddress(data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Reverse geocoding aborted: timeout')
        alert('Reverse geocoding timed out. Please try searching manually.')
      } else {
        console.error('Reverse geocoding error:', err.message)
        alert('Failed to get address from coordinates. Please try searching manually.')
      }
    }
  }

  const handleGeocode = async () => {
    if (!locationText.trim()) {
      alert('Please enter a location')
      return
    }

    setLoading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(
        `/api/geocode/search?q=${encodeURIComponent(locationText)}`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('Location not found. Please try a different search.')
        } else {
          alert('Failed to search location. Please try again.')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      setAddress(data.address || locationText)
      setLoading(false)
    } catch (err) {
        if (err.name === 'AbortError') {
          console.error('Geocoding aborted: timeout')
          alert('Location search timed out. Try again.')
        } else {
          console.error('Geocoding error:', err.message)
          alert('Failed to search location. Please try again.')
        }
        setLoading(false)
    }
  }

  const handleConfirm = () => {
    if (address && typeof onSelectLocation === 'function') {
      try {
        onSelectLocation(address, null)
        setLocationText('')
        setAddress('')
        onClose()
      } catch (err) {
        console.error('Callback error:', err)
      }
    }
  }

  const handleClose = () => {
    setLocationText('')
    setAddress('')
    onClose()
  }

  if (!open) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Your Location</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              onClick={getCurrentLocation} 
              variant="contained" 
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : '📍 Use GPS'}
            </Button>
          </Box>
          
          <Typography variant="body2" color="textSecondary" align="center">
            OR
          </Typography>

          <TextField
            label="Search location by name"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            fullWidth
            placeholder="e.g., Delhi, New York, Times Square"
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleGeocode()
            }}
            disabled={loading}
          />
          <Button 
            onClick={handleGeocode} 
            variant="outlined" 
            fullWidth
            disabled={loading}
          >
            Search Location
          </Button>

          {address && (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Location:
              </Typography>
              <Typography variant="body2">{address}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          disabled={!address || loading}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  )
}
