import React, {useState} from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import OTPModal from './OTPModal'

export default function RegisterModal({open, onClose, onRegistered}){
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [otpValue, setOtpValue] = useState('')

  const handleRegister = async () => {
    // simple client-side validation
    if (!email.trim()) {
      alert('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, name })
      })
      const data = await res.json()
      // handle existing user specially: offer login via OTP
      if (!res.ok && data && data.message && data.message.toLowerCase().includes('user already exists')) {
        const sendLogin = window.confirm('This email is already registered. Send a login OTP instead?')
        if (sendLogin) {
          try {
            const loginRes = await fetch('/api/user/login', {
              method: 'POST', headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ email })
            })
            const loginData = await loginRes.json()
            if (loginData.otp) {
              alert(loginData.message + '\n\nOTP (for testing): ' + loginData.otp)
            } else {
              alert(loginData.message)
            }
            if (loginRes.ok) {
              if (document && document.activeElement) document.activeElement.blur()
              setOtpOpen(true)
            }
          } catch (e) {
            alert('Network error')
          }
        }
        // do not show the backend "User already exists" message
        return
      }

      // default behaviour: show message and OTP if returned
      if (data.otp) {
        alert(data.message + '\n\nOTP (for testing): ' + data.otp)
      } else {
        alert(data.message || 'Check email for OTP')
      }
      if (res.ok) {
        if (document && document.activeElement) document.activeElement.blur()
        setOtpOpen(true)
      }
    } catch (err) {
      alert('Network error')
    } finally { setLoading(false) }
  }

  const handleVerify = async (value) => {
    setLoading(true)
    try {
      console.log(`[Verify] Verifying with email=${email}, otp=${value}`)
      const res = await fetch('/api/user/verify', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ email, otp: value })
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('[Verify] Error:', data.message)
        return alert(data.message || 'Verification failed')
      }
      
      // Check for notifications (item matches)
      if (data.notifications && data.notifications.length > 0) {
        const notifMsg = data.notifications.map(n => `✓ ${n.message}\n  Match Score: ${n.matchScore}%`).join('\n\n')
        alert(data.message + '\n\nYou have ' + data.notifications.length + ' potential matches for your items:\n\n' + notifMsg)
      } else {
        alert(data.message || 'Verified!')
      }
      
      // use user from response or construct from state
      const user = data.user || { email, name, verified: true }
      // Store notifications in user object if they exist
      if (data.notifications) {
        user.notifications = data.notifications
      }
      console.log('[Verify] Login user:', user)
      localStorage.setItem('user', JSON.stringify(user))
      if (onRegistered) onRegistered(user)
      setOtpOpen(false)
      onClose()
    } catch (err) {
      console.error('[Verify] Network error:', err)
      alert('Network error')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Dialog open={!!open} onClose={onClose} disableEnforceFocus>
        <DialogTitle>Register</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Name" fullWidth value={name} onChange={e=>setName(e.target.value)} />
          <TextField margin="dense" label="Email" fullWidth value={email} onChange={e=>setEmail(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            variant="contained"
            onClick={handleRegister}
            disabled={loading}
          >
            Register
          </Button>
        </DialogActions>
      </Dialog>
      <OTPModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        otpValue={otpValue}
        setOtp={setOtpValue}
        onVerify={handleVerify}
      />
    </>
  )
}
