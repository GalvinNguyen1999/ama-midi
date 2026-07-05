import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Alert, AlertTitle, Box, Collapse } from '@mui/material'
import { useState } from 'react'

const STORAGE_KEY = 'ama-midi:onboarded'

function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function markOnboarded() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    return
  }
}

export function OnboardingCallout() {
  const [open, setOpen] = useState(() => !hasOnboarded())

  const dismiss = () => {
    setOpen(false)
    markOnboarded()
  }

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        onClose={dismiss}
        sx={{ mb: 2, borderRadius: 2, alignItems: 'flex-start' }}
      >
        <AlertTitle sx={{ fontWeight: 700 }}>New to the piano roll?</AlertTitle>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          <li>
            Time runs <strong>top → bottom</strong> (0–300s); the 8 <strong>tracks</strong> run left →
            right.
          </li>
          <li>
            <strong>Click</strong> an empty cell to add a note; <strong>drag</strong> a note (or a box
            around several) to move; <strong>click</strong> a note to edit it in the side panel.
          </li>
          <li>
            <strong>Right-click</strong> a note for quick actions · <strong>⌘D</strong> duplicate ·
            <strong> Delete</strong> to remove · <strong>arrow keys</strong> to nudge.
          </li>
          <li>
            Hit <strong>Play</strong> to hear it (click the <strong>ruler</strong> to jump) —
            <strong> ⌘Z / ⇧⌘Z</strong> to undo or redo.
          </li>
        </Box>
      </Alert>
    </Collapse>
  )
}
