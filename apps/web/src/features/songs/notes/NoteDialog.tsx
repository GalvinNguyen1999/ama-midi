import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { TIME_MAX, TIME_MIN, TRACK_MAX, TRACK_MIN } from '~/features/pianoRoll/config'
import { noteSchema, type NoteFormValues } from '~/features/songs/notes/noteSchema'

export type { NoteFormValues }

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  initial: NoteFormValues
  onClose: () => void
  onSubmit: (values: NoteFormValues) => void
  onDelete?: () => void
}

const PRESET_COLORS = ['#7c3aed', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899']
const TRACKS = Array.from({ length: TRACK_MAX - TRACK_MIN + 1 }, (_, i) => TRACK_MIN + i)

export function NoteDialog({ open, mode, initial, onClose, onSubmit, onDelete }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema), defaultValues: initial })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = watch('color')

  useEffect(() => {
    if (open) {
      reset(initial)
      setConfirmDelete(false)
    }
  }, [open, initial, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{mode === 'create' ? 'New note' : 'Edit note'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              autoFocus
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register('title')}
            />
            <TextField label="Description" fullWidth multiline minRows={2} {...register('description')} />
            <Stack direction="row" spacing={2}>
              <Controller
                name="track"
                control={control}
                render={({ field }) => (
                  <TextField select label="Track" fullWidth {...field}>
                    {TRACKS.map((t) => (
                      <MenuItem key={t} value={t}>
                        Track {t}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <TextField
                label="Time (s)"
                type="number"
                fullWidth
                error={Boolean(errors.time)}
                helperText={errors.time?.message}
                slotProps={{ htmlInput: { min: TIME_MIN, max: TIME_MAX, step: 0.5 } }}
                {...register('time', { valueAsNumber: true })}
              />
            </Stack>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Color
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                {PRESET_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setValue('color', c)}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      bgcolor: c,
                      cursor: 'pointer',
                      boxShadow: color === c ? '0 0 0 2px #fff' : 'none',
                    }}
                  />
                ))}
                <Box
                  component="input"
                  type="color"
                  value={color}
                  onChange={(e) => setValue('color', e.target.value)}
                  sx={{ width: 34, height: 34, p: 0, border: 'none', bgcolor: 'transparent', cursor: 'pointer' }}
                />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {mode === 'edit' && onDelete ? (
            confirmDelete ? (
              <Button color="error" variant="contained" onClick={onDelete} sx={{ mr: 'auto' }}>
                Confirm delete
              </Button>
            ) : (
              <Button color="error" onClick={() => setConfirmDelete(true)} sx={{ mr: 'auto' }}>
                Delete
              </Button>
            )
          ) : null}
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
