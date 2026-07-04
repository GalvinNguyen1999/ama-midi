import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { fetchInvites, respondInvite } from '~/store/invitesSlice'
import { fetchSongs } from '~/store/songSlice'

function actorName(email: string | null): string {
  return email ? email.split('@')[0] : 'Someone'
}

export function NotificationBell() {
  const dispatch = useAppDispatch()
  const invites = useAppSelector((s) => s.invites.items)
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  useEffect(() => {
    dispatch(fetchInvites())
  }, [dispatch])

  const respond = async (songId: string, accept: boolean) => {
    const res = await dispatch(respondInvite({ songId, accept }))
    if (respondInvite.fulfilled.match(res)) {
      if (accept) dispatch(fetchSongs())
      toast.success(accept ? 'Invitation accepted' : 'Invitation declined')
    }
  }

  return (
    <>
      <Tooltip title="Invitations">
        <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
          <Badge badgeContent={invites.length} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 440 } } }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2, py: 1 }}>
          Invitations
        </Typography>
        <Divider />

        {invites.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              You&apos;re all caught up.
            </Typography>
          </Box>
        ) : (
          invites.map((invite) => (
            <ListItem key={invite.songId} divider alignItems="flex-start" sx={{ display: 'block' }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <ListItemAvatar sx={{ minWidth: 0 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                    {actorName(invite.ownerEmail).charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <>
                      <strong>{actorName(invite.ownerEmail)}</strong> invited you to “{invite.title}”
                    </>
                  }
                  slotProps={{ primary: { variant: 'body2' } }}
                />
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 0.5 }}>
                <Button size="small" onClick={() => respond(invite.songId, false)}>
                  Decline
                </Button>
                <Button size="small" variant="contained" onClick={() => respond(invite.songId, true)}>
                  Accept
                </Button>
              </Stack>
            </ListItem>
          ))
        )}
      </Menu>
    </>
  )
}
