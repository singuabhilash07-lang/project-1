import React, { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Typography from '@mui/material/Typography'
import MapPicker from '../components/MapPicker'

export default function ReportPage({ type, user, onSuccess, onCancel, existing }) {
  const [name, setName] = useState(existing?.name || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [location, setLocation] = useState(existing?.location || '')
  const [date, setDate] = useState(existing?.date || '')
  const [category, setCategory] = useState(existing?.category || 'Other')
  const [imageFile, setImageFile] = useState(null)
  const [imageData, setImageData] = useState(existing?.image || '')
  const [mobile, setMobile] = useState(existing?.mobile || '')
  const [altMobile, setAltMobile] = useState(existing?.altMobile || '')
  const [loading, setLoading] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const categories = [
    'Electronics',
    'Documents',
    'Jewelry',
    'Clothing',
    'Accessories',
    'Pets',
    'Other'
  ]

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImageData(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!user || !user.email) {
      alert('Please register or log in first')
      return
    }
    setLoading(true)
    try {
      const payload = {
        name,
        description,
        location,
        date,
        category,
        type: type === 'lost' ? 'lost' : 'found',
        ownerEmail: user.email,
      }
      if (imageData) payload.image = imageData
      let res
      if (existing) {
        res = await fetch(`/api/item/edit/${encodeURIComponent(existing.name)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/item/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Could not save item')
      alert(existing ? 'Item updated successfully' : 'Item reported successfully')
      onSuccess && onSuccess()
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p:4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" mb={3}>{type === 'lost' ? 'Report Lost Item' : 'Report Found Item'}</Typography>
      <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField label="Item Name" value={name} onChange={e=>setName(e.target.value)} fullWidth />
        <TextField label="Description" multiline rows={3} value={description} onChange={e=>setDescription(e.target.value)} fullWidth />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField label="Location" value={location} onChange={e=>setLocation(e.target.value)} fullWidth />
          <Button variant="outlined" onClick={() => setMapOpen(true)} sx={{ mt: 1 }}>📍 Map</Button>
        </Box>
        <TextField
          label={type === 'found' ? 'Finder Mobile (your phone)' : 'Your Mobile (owner phone)'}
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          maxLength="10"
          fullWidth
        />
        <TextField label="Alternate Mobile (optional)" value={altMobile} onChange={e=>setAltMobile(e.target.value)} maxLength="10" fullWidth />
        <TextField
          label="Date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={e=>setDate(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={e=>setCategory(e.target.value)}>
            {categories.map(cat => (<MenuItem key={cat} value={cat}>{cat}</MenuItem>))}
          </Select>
        </FormControl>
        <Box>
          <Button variant="outlined" component="label">
            {imageFile ? 'Change Image' : 'Attach Image (optional)'}
            <input type="file" hidden accept="image/*" onChange={handleImageChange} />
          </Button>
          {imageData && <Box sx={{ mt:2 }}><img src={imageData} alt="attachment" style={{maxWidth:'100%',borderRadius:8}} /></Box>}
        </Box>
        <Box sx={{ display:'flex', gap:2, mt:2 }}> 
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>Submit</Button>
        </Box>
      </Box>
      <MapPicker open={mapOpen} onClose={() => setMapOpen(false)} onSelectLocation={(addr, coords) => {
        setLocation(addr || '')
      }} />
    </Box>
  )
}

