import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import {
  Avatar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { getSongEvents } from '~/apis/midi'
import type { NoteEvent } from '~/types/midi'
import { relativeTime } from '~/utils/session'

interface Props {
  songId: string | undefined
  version: number | undefined
  open: boolean
  onClose: () => void
}

const VERB: Record<NoteEvent['type'], string> = {
  CREATE: 'added',
  UPDATE: 'edited',
  DELETE: 'removed',
}

const COLOR: Record<NoteEvent['type'], string> = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
}

function actorName(actor: string | null): string {
  return actor ? actor.split('@')[0] : 'Someone'
}

function describe(event: NoteEvent): string {
  const title = event.payload?.title ? `“${event.payload.title}”` : 'a note'
  return `${actorName(event.actor)} ${VERB[event.type]} ${title}`
}

export function HistoryDrawer({ songId, version, open, onClose }: Props) {
  const [events, setEvents] = useState<NoteEvent[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !songId) return
    let active = true
    setLoading(true)
    getSongEvents(songId)
      .then((rows) => {
        if (active) setEvents([...rows].reverse())
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, songId, version])

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: 360 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>
            Activity
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {loading && events.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={22} />
        </Box>
      ) : events.length === 0 ? (
        <Typography color="text.secondary" variant="body2" sx={{ px: 2, py: 4, textAlign: 'center' }}>
          No activity yet.
        </Typography>
      ) : (
        <List dense disablePadding>
          {events.map((event) => (
            <ListItem key={event.id} divider alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: COLOR[event.type], width: 30, height: 30, fontSize: 13 }}>
                  {actorName(event.actor).charAt(0).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={describe(event)}
                secondary={relativeTime(event.createdAt)}
                slotProps={{ primary: { variant: 'body2' } }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Drawer>
  )
}
