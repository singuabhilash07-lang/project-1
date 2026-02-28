import React, {useState} from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MapPicker from '../components/MapPicker'

export default function LostItemForm(){
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [altMobile, setAltMobile] = useState('')
  const [mapOpen, setMapOpen] = useState(false)

  const validateEmail = (e) => {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
  }
  const validateMobile = (m) => {
    return m === '' || /^\d{10}$/.test(m)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return alert('Name is required')
    if (!description.trim()) return alert('Description is required')
    if (ownerEmail && !validateEmail(ownerEmail)) return alert('Invalid email')
    if (!validateMobile(mobile)) return alert('Mobile must be 10 digits')
    if (!validateMobile(altMobile)) return alert('Alternate mobile must be 10 digits')

    try {
      const res = await fetch('/api/item/add', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, description, ownerEmail, mobile, altMobile })
      })
      const data = await res.json()
      alert(data.message || 'Submitted')
      setName(''); setDescription(''); setOwnerEmail(''); setMobile(''); setAltMobile('')
    } catch (err) { alert('Network error') }
  }

  return (
    <Box sx={{ p: 2 }}>
      <p className="text-sm text-gray-600 mb-2">(Providing an email or phone number makes it easier for finders to reach you.)</p>
      <TextField label="Item name" fullWidth value={name} onChange={e=>setName(e.target.value)} sx={{ mb:2 }} />
      <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={e=>setDescription(e.target.value)} sx={{ mb:2 }} />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2 }}>
        <TextField label="Location (optional)" fullWidth value={location} onChange={e=>setLocation(e.target.value)} />
        <Button variant="outlined" onClick={() => setMapOpen(true)} sx={{ mt: 1 }}>📍 Map</Button>
      </Box>
      <TextField label="Your email" fullWidth value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} sx={{ mb:2 }} />
      <TextField label="Your mobile (optional)" placeholder="digits only" maxLength="10" fullWidth value={mobile} onChange={e=>setMobile(e.target.value)} sx={{ mb:2 }} />
      <TextField label="Your alternate mobile (optional)" placeholder="digits only" maxLength="10" fullWidth value={altMobile} onChange={e=>setAltMobile(e.target.value)} sx={{ mb:2 }} />
      <Button variant="contained" onClick={handleSubmit}>Report Lost Item</Button>
      <MapPicker open={mapOpen} onClose={() => setMapOpen(false)} onSelectLocation={(addr, coords) => {
        setLocation(addr || '')
      }} />
    </Box>
  )
}
