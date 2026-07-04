import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import GroupIcon from '@mui/icons-material/Group'
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic'
import LinkIcon from '@mui/icons-material/Link'
import PersonIcon from '@mui/icons-material/Person'
import SearchIcon from '@mui/icons-material/Search'
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { NoteFingerprint } from '~/features/library/NoteFingerprint'
import { useAppDispatch, useAppSelector } from '~/store/hooks'
import { createSong, fetchSongs, removeSong } from '~/store/songSlice'
import type { Song } from '~/types/midi'
import { readUser, relativeTime } from '~/utils/session'

const ACCENTS = ['#7c3aed', '#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#06b6d4']

function accentFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

interface StatProps {
  icon: ReactNode
  label: string
  value: string | number
}

function StatCard({ icon, label, value }: StatProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main' }}>{icon}</Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export function LibraryPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useMemo(readUser, [])
  const songs = useAppSelector((s) => s.song.songs)

  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const creatingRef = useRef(false)
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    dispatch(fetchSongs()).finally(() => setLoading(false))
  }, [dispatch])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return songs
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || (s.ownerEmail ?? '').toLowerCase().includes(q),
    )
  }, [songs, query])

  const stats = useMemo(() => {
    const owned = songs.filter((s) => s.ownerId && s.ownerId === user?.id).length
    const shared = songs.filter((s) => s.ownerId && s.ownerId !== user?.id).length
    const latest = songs.reduce<string | null>(
      (acc, s) => (!acc || s.updatedAt > acc ? s.updatedAt : acc),
      null,
    )
    return { total: songs.length, owned, shared, latest }
  }, [songs, user])

  const handleCreate = async () => {
    if (creatingRef.current) return
    const title = newTitle.trim()
    if (!title) {
      toast.error('Song title is required')
      return
    }
    creatingRef.current = true
    setCreating(true)
    try {
      const res = await dispatch(createSong(title))
      if (createSong.fulfilled.match(res)) {
        toast.success(`Song “${title}” created`)
        setNewTitle('')
        setNewOpen(false)
        navigate(`/songs/${res.payload.id}`)
      }
    } finally {
      creatingRef.current = false
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await dispatch(removeSong(deleteTarget.id))
    setDeleting(false)
    if (removeSong.fulfilled.match(res)) toast.success('Song deleted')
    setDeleteTarget(null)
  }

  const copyLink = async (id: string) => {
    const url = `${window.location.origin}/songs/${id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied')
    } catch {
      toast.info(url)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            Studio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your MIDI sequences and shared sessions
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setNewOpen(true)}
        >
          New Song
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard icon={<LibraryMusicIcon />} label="Total songs" value={stats.total} />
        <StatCard icon={<PersonIcon />} label="Owned by you" value={stats.owned} />
        <StatCard icon={<GroupIcon />} label="Shared with you" value={stats.shared} />
        <StatCard
          icon={<AccessTimeIcon />}
          label="Last activity"
          value={stats.latest ? relativeTime(stats.latest) : '—'}
        />
      </Box>

      <TextField
        placeholder="Search by title or owner…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        sx={{ mb: 3, maxWidth: 420 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {loading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2.5,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 3 }} />
          ))}
        </Box>
      ) : songs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
          <LibraryMusicIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            No songs yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first song to start sketching a MIDI sequence.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>
            Create a song
          </Button>
        </Paper>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
          No songs match “{query}”.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2.5,
          }}
        >
          {filtered.map((song) => {
            const owned = !song.ownerId || song.ownerId === user?.id
            const role = owned ? 'Owner' : song.shareMode === 'view' ? 'Viewer' : 'Editor'
            const roleColor = owned ? 'primary' : song.shareMode === 'view' ? 'warning' : 'success'
            const accent = accentFor(song.id)
            return (
              <Card
                key={song.id}
                sx={{
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.12s, border-color 0.12s',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: accent },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/songs/${song.id}`)}
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <NoteFingerprint id={song.id} noteCount={song.noteCount} accent={accent} />
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: accent, width: 40, height: 40 }}>
                        <GraphicEqIcon />
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {song.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {owned ? 'You' : song.ownerEmail ?? 'Unknown'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        color={roleColor}
                        variant={owned ? 'filled' : 'outlined'}
                        label={role}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`${song.noteCount.toLocaleString()} note${song.noteCount === 1 ? '' : 's'}`}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                        label={relativeTime(song.updatedAt)}
                      />
                    </Stack>
                    {song.collaborators.length > 0 ? (
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1.5 }}>
                        <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <AvatarGroup
                          max={4}
                          sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 11 } }}
                        >
                          {song.collaborators.map((c) => (
                            <Tooltip key={c.email} title={c.email}>
                              <Avatar>{c.email.charAt(0).toUpperCase()}</Avatar>
                            </Tooltip>
                          ))}
                        </AvatarGroup>
                      </Stack>
                    ) : null}
                  </CardContent>
                </CardActionArea>
                <Stack direction="row" justifyContent="flex-end" sx={{ px: 1, pb: 1 }}>
                  <Tooltip title="Copy invite link">
                    <IconButton size="small" onClick={() => copyLink(song.id)}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {owned ? (
                    <Tooltip title="Delete song">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(song)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Stack>
              </Card>
            )
          })}
        </Box>
      )}

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New song</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            required
            label="Song title"
            placeholder={`Song ${songs.length + 1}`}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            error={!newTitle.trim()}
            helperText={!newTitle.trim() ? 'Song title is required' : ' '}
            sx={{ mt: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreate()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            loading={creating}
            disabled={!newTitle.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Delete song</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete “{deleteTarget?.title}” and all its notes? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
