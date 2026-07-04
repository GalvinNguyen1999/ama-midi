import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LinkIcon from '@mui/icons-material/Link'
import {
  Avatar,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'

import type { Collaborator } from '~/types/midi'

interface Props {
  open: boolean
  anchorEl: HTMLElement | null
  onClose: () => void
  isOwner: boolean
  shareUrl: string
  shareMode: 'edit' | 'view'
  onSetShare: (mode: 'edit' | 'view') => void
  onCopy: () => void
  inviteEmail: string
  onInviteEmailChange: (value: string) => void
  inviting: boolean
  onInvite: () => void
  collaborators: Collaborator[]
  onRemoveCollaborator: (userId: string, email: string) => void
}

export function SharePopover({
  open,
  anchorEl,
  onClose,
  isOwner,
  shareUrl,
  shareMode,
  onSetShare,
  onCopy,
  inviteEmail,
  onInviteEmailChange,
  inviting,
  onInvite,
  collaborators,
  onRemoveCollaborator,
}: Props) {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { sx: { p: 2, width: 340 } } }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Share this song
      </Typography>

      {isOwner ? (
        <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
          <InputLabel id="share-mode-label">Link access</InputLabel>
          <Select
            labelId="share-mode-label"
            label="Link access"
            value={shareMode}
            onChange={(e) => onSetShare(e.target.value as 'edit' | 'view')}
          >
            <MenuItem value="edit">Anyone with the link can edit</MenuItem>
            <MenuItem value="view">Anyone with the link can view</MenuItem>
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Anyone with the link can {shareMode === 'view' ? 'view' : 'edit'}.
        </Typography>
      )}

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          fullWidth
          value={shareUrl}
          slotProps={{ input: { readOnly: true } }}
          onFocus={(e) => e.target.select()}
        />
        <Button variant="contained" startIcon={<LinkIcon />} onClick={onCopy}>
          Copy
        </Button>
      </Stack>

      {isOwner ? (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 0.75 }}>
            Invite a registered user by email
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              type="email"
              placeholder="name@example.com"
              value={inviteEmail}
              onChange={(e) => onInviteEmailChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onInvite()
                }
              }}
            />
            <Button variant="outlined" onClick={onInvite} loading={inviting} disabled={!inviteEmail.trim()}>
              Invite
            </Button>
          </Stack>

          {collaborators.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                People with access
              </Typography>
              <Stack spacing={0.5}>
                {collaborators.map((c) => (
                  <Stack key={c.userId} direction="row" alignItems="center" spacing={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                      {c.email.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                      {c.email}
                    </Typography>
                    {c.status === 'pending' ? (
                      <Chip size="small" variant="outlined" color="warning" label="Pending" />
                    ) : null}
                    <Tooltip title="Remove access">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveCollaborator(c.userId, c.email)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Box>
          ) : null}
        </>
      ) : null}
    </Popover>
  )
}
