import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import {
  Avatar,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { TIME_MAX, TRACK_MAX, TRACK_MIN, clamp } from '~/features/pianoRoll/config'
import type { Note } from '~/types/midi'

interface FieldPatch {
  title?: string
  track?: number
  time?: number
  color?: string
}

interface Props {
  selected: Note[]
  canEdit: boolean
  onUpdateField: (note: Note, patch: FieldPatch) => void
  onDuplicate: (notes: Note[]) => void
  onDeleteMany: (ids: string[]) => void
  onEditDetails: (note: Note) => void
  presence: { id: string; email: string }[]
  userId?: string
}

function NoteFields({
  note,
  canEdit,
  onUpdateField,
}: {
  note: Note
  canEdit: boolean
  onUpdateField: (note: Note, patch: FieldPatch) => void
}) {
  const [title, setTitle] = useState(note.title)
  const [time, setTime] = useState(String(note.time))

  useEffect(() => {
    setTitle(note.title)
    setTime(String(note.time))
  }, [note.id, note.title, note.time])

  const commitTitle = () => {
    const value = title.trim()
    if (value && value !== note.title) onUpdateField(note, { title: value })
    else setTitle(note.title)
  }

  const commitTime = () => {
    const value = Number(time)
    if (!Number.isFinite(value)) {
      setTime(String(note.time))
      return
    }
    const clamped = clamp(Math.round(value * 1000) / 1000, 0, TIME_MAX)
    if (clamped !== note.time) onUpdateField(note, { time: clamped })
    else setTime(String(note.time))
  }

  return (
    <Stack spacing={1.5}>
      <TextField
        label="Title"
        size="small"
        value={title}
        disabled={!canEdit}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
      <Stack direction="row" spacing={1}>
        <Select
          size="small"
          fullWidth
          value={note.track}
          disabled={!canEdit}
          onChange={(e) => onUpdateField(note, { track: Number(e.target.value) })}
        >
          {Array.from({ length: TRACK_MAX - TRACK_MIN + 1 }, (_, i) => TRACK_MIN + i).map((t) => (
            <MenuItem key={t} value={t}>
              Track {t}
            </MenuItem>
          ))}
        </Select>
        <TextField
          label="Time (s)"
          size="small"
          type="number"
          value={time}
          disabled={!canEdit}
          onChange={(e) => setTime(e.target.value)}
          onBlur={commitTime}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
          sx={{ width: 110 }}
        />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Color
        </Typography>
        <Box
          component="input"
          type="color"
          value={note.color}
          disabled={!canEdit}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onUpdateField(note, { color: e.target.value })
          }
          sx={{ width: 40, height: 28, border: 'none', bgcolor: 'transparent', cursor: 'pointer' }}
        />
      </Stack>
    </Stack>
  )
}

export function EditorSidebar({
  selected,
  canEdit,
  onUpdateField,
  onDuplicate,
  onDeleteMany,
  onEditDetails,
  presence,
  userId,
}: Props) {
  const single = selected.length === 1 ? selected[0] : null

  return (
    <Paper variant="outlined" sx={{ p: 2, width: 300, borderRadius: 3, alignSelf: 'flex-start' }}>
      {single ? (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Note
          </Typography>
          <NoteFields note={single} canEdit={canEdit} onUpdateField={onUpdateField} />
          {canEdit ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => onDuplicate([single])}
              >
                Duplicate
              </Button>
              <Button size="small" startIcon={<OpenInFullIcon />} onClick={() => onEditDetails(single)}>
                Details
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => onDeleteMany([single.id])}
              >
                Delete
              </Button>
            </Stack>
          ) : null}
        </>
      ) : selected.length > 1 ? (
        <>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            {selected.length} notes selected
          </Typography>
          {canEdit ? (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={() => onDuplicate(selected)}
              >
                Duplicate all
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => onDeleteMany(selected.map((n) => n.id))}
              >
                Delete all
              </Button>
            </Stack>
          ) : null}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select a note to edit its details, or drag a box to select several.
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        In this session
      </Typography>
      {presence.length > 0 ? (
        <Stack spacing={0.75}>
          {presence.map((p) => (
            <Stack key={p.id} direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: p.id === userId ? 'primary.main' : 'grey.700' }}>
                {(p.email[0] ?? '?').toUpperCase()}
              </Avatar>
              <Typography variant="body2" noWrap>
                {p.id === userId ? `${p.email} (you)` : p.email}
              </Typography>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="caption" color="text.disabled">
          Just you right now.
        </Typography>
      )}
    </Paper>
  )
}
