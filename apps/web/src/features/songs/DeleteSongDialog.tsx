import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material'

interface Props {
  open: boolean
  title: string
  deleting: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteSongDialog({ open, title, deleting, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Delete song</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          Delete “{title}” and all its notes? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} loading={deleting}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
