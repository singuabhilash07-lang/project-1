import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl } from '@mui/material'

export default function ReportModal({ open, onClose, type, user, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('Other')
  const [loading, setLoading] = useState(false)

  const categories = [
    'Electronics',
    'Documents',
    'Jewelry',
    'Clothing',
    'Accessories',
    'Pets',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!user || !user.email) return alert('Please register first')
    setLoading(true)
    try {
      const payload = {
        name,
        description,
        location,
        date,
        category,
        type: type === 'lost' ? 'lost' : 'found',
        ownerEmail: user.email
      }
      const res = await fetch('/api/item/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Could not add item')
      alert('Item reported successfully')
      onSuccess && onSuccess()
      onClose()
    } catch (err) {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{type === 'lost' ? 'Report Lost Item' : 'Report Found Item'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Item Name"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Location"
          fullWidth
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Category</InputLabel>
          <Select
            value={category}
            label="Category"
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  )
}
