import React, {useState} from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import OTPModal from './OTPModal'

export default function ItemCard({item, user, onClaimed}){
  const [modalOpen, setModalOpen] = useState(false)
  const [otp, setOtp] = useState('')
  const isOwner = user && (user.email === item.ownerEmail || user.email === item.owner_email)

  const handleClaim = async () => {
    try {
      const res = await fetch(`/api/item/claim/${encodeURIComponent(item.name)}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Claim failed')
      alert(data.message)
      setModalOpen(true)
    } catch (err) {
      alert('Network error')
    }
  }

  const handleVerify = async (value) => {
    try {
      const res = await fetch(`/api/item/verify/${encodeURIComponent(item.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: value })
      })
      const data = await res.json()
      if (!res.ok) return alert(data.message || 'Verify failed')
      alert(data.message)
      setModalOpen(false)
      // inform parent UI to remove this item if provided
      if (typeof onClaimed === 'function') onClaimed(item.name)
    } catch (err) {
      alert('Network error')
    }
  }

  return (
    <>
      <Card sx={{ minWidth: 275 }}>
        <CardContent>
          <Typography variant="h6" component="div">{item.name}</Typography>
          <Typography sx={{ mb: 1.5 }} color="text.secondary">{item.ownerEmail || item.owner_email || ''}</Typography>
          <Typography variant="body2">{item.description}</Typography>
        </CardContent>
        <CardActions>
          {!isOwner && <Button size="small" onClick={handleClaim}>Claim</Button>}
          {isOwner && <Typography variant="caption" color="text.secondary">Your listing</Typography>}
        </CardActions>
      </Card>
      <OTPModal open={modalOpen} onClose={() => setModalOpen(false)} otpValue={otp} setOtp={setOtp} onVerify={handleVerify} />
    </>
  )
}
