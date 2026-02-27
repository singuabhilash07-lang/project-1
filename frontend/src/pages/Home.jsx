import React, {useEffect, useState} from 'react'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function Home(){
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(setItems)
      .catch(() => setItems([]))
  }, [])

  const handleSearch = async () => {
    if (!query) return setMatches([])
    const res = await fetch(`/api/match?q=${encodeURIComponent(query)}`)
    const data = await res.json()
    setMatches(data)
  }

  return (
    <div>
      <Navbar />
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="Search for matching items" fullWidth value={query} onChange={e=>setQuery(e.target.value)} />
          <Button variant="outlined" onClick={handleSearch}>Search</Button>
        </Box>

        {matches.length > 0 ? (
          <Grid container spacing={2}>
            {matches.map((m, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <ItemCard item={m.item} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={2}>
            {items.length === 0 && (
              <Grid item xs={12}><Box sx={{ p:4, textAlign: 'center' }}>No items yet.</Box></Grid>
            )}
            {items.map((it, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <ItemCard item={it} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </div>
  )
}
