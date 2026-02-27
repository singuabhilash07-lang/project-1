import React, {useState} from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function FoundItemForm(){
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/item/add', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, description, ownerEmail })
      })
      const data = await res.json()
      alert(data.message || 'Submitted')
      setName(''); setDescription(''); setOwnerEmail('')
    } catch (err) { alert('Network error') }
  }

  return (
    <Box sx={{ p: 2 }}>
      <TextField label="Item name" fullWidth value={name} onChange={e=>setName(e.target.value)} sx={{ mb:2 }} />
      <TextField label="Description" fullWidth multiline rows={3} value={description} onChange={e=>setDescription(e.target.value)} sx={{ mb:2 }} />
      <TextField label="Owner contact email (if known)" fullWidth value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)} sx={{ mb:2 }} />
      <Button variant="contained" onClick={handleSubmit}>Report Found Item</Button>
    </Box>
  )
}
