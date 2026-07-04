import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { clearNotifications, markAllRead } from '~/store/notificationsSlice'
import { relativeTime } from '~/utils/session'

export function NotificationBell() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const items = useAppSelector((s) => s.notifications.items)
  const unread = items.filter((n) => !n.read).length
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const open = (e: React.MouseEvent<HTMLElement>) => {
    setAnchor(e.currentTarget)
    if (unread > 0) dispatch(markAllRead())
  }

  const openSong = (songId: string) => {
    setAnchor(null)
    navigate(`/songs/${songId}`)
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={open}>
          <Badge badgeContent={unread} color="error">
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420 } } }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
          </Typography>
          {items.length > 0 ? (
            <Button size="small" onClick={() => dispatch(clearNotifications())}>
              Clear
            </Button>
          ) : null}
        </Stack>
        <Divider />

        {items.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              You&apos;re all caught up.
            </Typography>
          </Box>
        ) : (
          items.map((n) => (
            <ListItemButton key={n.id} onClick={() => openSong(n.songId)} sx={{ alignItems: 'flex-start' }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <PersonAddIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <>
                    <strong>{n.by.split('@')[0]}</strong> invited you to “{n.title}”
                  </>
                }
                secondary={relativeTime(new Date(n.at).toISOString())}
                slotProps={{ primary: { variant: 'body2' } }}
              />
            </ListItemButton>
          ))
        )}
      </Menu>
    </>
  )
}
