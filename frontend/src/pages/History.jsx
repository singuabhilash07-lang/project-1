import React, { useState, useEffect } from 'react'
import ItemCard from '../components/ItemCard'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import ReportPage from './ReportPage'

export default function History({ user }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)

  const refresh = () => {
    setLoading(true)
    fetch(`/api/user/items?email=${encodeURIComponent(user.email)}`)
      .then(r => r.json())
      .then(arr => {
        setItems(arr)
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setLoading(false)
      })
  }

  useEffect(() => {
    if (!user || !user.email) {
      setItems([])
      setLoading(false)
      return
    }
    refresh()
  }, [user])


  if (!user) {
    return <Box sx={{ p:4 }}>Please register or log in to see your history.</Box>
  }

  const onEdit = (item) => {
    setEditing(item)
  }

  const onDelete = async (item) => {
    if (!window.confirm('Delete this item?')) return
      const res = await fetch(`/api/item/delete/${encodeURIComponent(item.name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerEmail: user.email })
    })
    const data = await res.json()
    if (!res.ok) return alert(data.message || 'Delete failed')
    alert('Item deleted')
    refresh()
  }

  return (
    <Box sx={{ p:4 }}>
      <h2 className="text-2xl font-bold mb-4">Your Report History</h2>

      {loading ? (
        <Box className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </Box>
      ) : editing ? (
        <ReportPage
          type={editing.type}
          user={user}
          existing={editing}
          onSuccess={() => { setEditing(null); refresh(); }}
          onCancel={() => setEditing(null)}
        />
      ) : items.length === 0 ? (
        <Box className="text-center py-12">No items reported yet.</Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((it, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <ItemCard item={it} user={user} />
              <Box className="mt-2 flex gap-2 justify-end">
                <Button size="small" onClick={() => onEdit(it)} variant="outlined">Edit</Button>
                <Button size="small" onClick={() => onDelete(it)} color="error" variant="text">Delete</Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
