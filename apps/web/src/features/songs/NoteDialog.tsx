import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { TIME_MAX, TIME_MIN, TRACK_MAX, TRACK_MIN } from '~/features/pianoRoll/config'

export interface NoteFormValues {
  title: string
  description: string
  track: number
  time: number
  color: string
}

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  initial: NoteFormValues
  onClose: () => void
  onSubmit: (values: NoteFormValues) => void
  onDelete?: () => void
}

export function NoteDialog({ open, mode, initial, onClose, onSubmit, onDelete }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({ defaultValues: initial })

  useEffect(() => {
    if (open) reset(initial)
  }, [open, initial, reset])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{mode === 'create' ? 'New note' : 'Edit note'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              error={Boolean(errors.title)}
              helperText={errors.title?.message}
              {...register('title', { required: 'Title is required' })}
            />
            <TextField label="Description" fullWidth multiline minRows={2} {...register('description')} />
            <TextField
              label="Track (1-8)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: TRACK_MIN, max: TRACK_MAX, step: 1 } }}
              {...register('track', { valueAsNumber: true, min: TRACK_MIN, max: TRACK_MAX })}
            />
            <TextField
              label="Time (0-300s)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: TIME_MIN, max: TIME_MAX, step: 0.5 } }}
              {...register('time', { valueAsNumber: true, min: TIME_MIN, max: TIME_MAX })}
            />
            <TextField label="Color" type="color" fullWidth {...register('color')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          {mode === 'edit' && onDelete ? (
            <Button color="error" onClick={onDelete} sx={{ mr: 'auto' }}>
              Delete
            </Button>
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
