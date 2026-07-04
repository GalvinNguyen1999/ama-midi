import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { Button, Paper, Typography } from '@mui/material'

interface Props {
  count: number
  acceptingAll: boolean
  suggesting: boolean
  onAcceptAll: () => void
  onAnother: () => void
  onDismiss: () => void
}

export function SuggestionBar({ count, acceptingAll, suggesting, onAcceptAll, onAnother, onDismiss }: Props) {
  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: 5,
      }}
    >
      <AutoAwesomeIcon fontSize="small" color="secondary" />
      <Typography variant="caption" color="text.secondary">
        {count} suggested — click a ghost, or
      </Typography>
      <Button size="small" variant="contained" onClick={onAcceptAll} loading={acceptingAll}>
        Accept all
      </Button>
      <Button size="small" onClick={onAnother} disabled={suggesting || acceptingAll}>
        Another
      </Button>
      <Button size="small" color="inherit" onClick={onDismiss} disabled={acceptingAll}>
        Dismiss
      </Button>
    </Paper>
  )
}
