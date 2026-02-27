import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

export default function OTPModal({open, onClose, otpValue, setOtp, onVerify}){
  return (
    <Dialog open={!!open} onClose={onClose} disableEnforceFocus>
      <DialogTitle>Enter OTP</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="OTP"
          fullWidth
          value={otpValue}
          onChange={e => setOtp(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={() => onVerify(otpValue)}>Verify</Button>
      </DialogActions>
    </Dialog>
  )
}
