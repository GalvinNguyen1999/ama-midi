import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CircleIcon from '@mui/icons-material/Circle'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileUploadIcon from '@mui/icons-material/FileUpload'
import HistoryIcon from '@mui/icons-material/History'
import LinkIcon from '@mui/icons-material/Link'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import RedoIcon from '@mui/icons-material/Redo'
import RepeatIcon from '@mui/icons-material/Repeat'
import StopIcon from '@mui/icons-material/Stop'
import UndoIcon from '@mui/icons-material/Undo'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'

import { HistoryDrawer } from '~/features/songs/history/HistoryDrawer'
import { SharePopover } from '~/features/songs/sharing/SharePopover'
import { BpmField } from '~/features/songs/toolbar/BpmField'
import type { useSharing } from '~/features/songs/sharing/useSharing'
import type { Timbre } from '~/features/songs/playback/usePlayback'
import type { useSongActions } from '~/features/songs/toolbar/useSongActions'
import type { useSongTitle } from '~/features/songs/toolbar/useSongTitle'
import type { Collaborator, SongWithNotes } from '~/types/midi'

interface Transport {
  playing: boolean
  playhead: number
  play: () => void
  stop: () => void
  loop: boolean
  toggleLoop: () => void
  timbre: Timbre
  setTimbre: (t: Timbre) => void
  bpm: number
  onCommitBpm: (bpm: number) => void
}

interface ToolbarHistory {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

interface ToolbarMidi {
  fileInputRef: RefObject<HTMLInputElement | null>
  onFile: (e: ChangeEvent<HTMLInputElement>) => void
  exportMidi: () => void
  exporting: boolean
  importMidi: () => void
  importing: boolean
}

interface ToolbarSuggestions {
  suggest: () => void
  suggesting: boolean
}

interface Props {
  songId: string | undefined
  current: SongWithNotes | null
  user: { id: string } | null
  isOwner: boolean
  canEdit: boolean
  readOnly: boolean
  connected: boolean
  presence: { id: string; email: string }[]
  collaborators: Collaborator[]
  onBack: () => void
  showDevTools: boolean

  title: ReturnType<typeof useSongTitle>
  sharing: ReturnType<typeof useSharing>
  songActions: ReturnType<typeof useSongActions>
  transport: Transport
  history: ToolbarHistory
  midi: ToolbarMidi
  suggestions: ToolbarSuggestions
}

export function EditorToolbar({
  songId,
  current,
  user,
  isOwner,
  canEdit,
  readOnly,
  connected,
  presence,
  collaborators,
  onBack,
  showDevTools,
  title,
  sharing,
  songActions,
  transport,
  history,
  midi,
  suggestions,
}: Props) {
  const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const closeMore = () => setMoreAnchor(null)

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 64,
        zIndex: 2,
        bgcolor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5 }} flexWrap="wrap">
          <Tooltip title="Back to library">
            <IconButton onClick={onBack} size="small">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          {title.editing ? (
            <TextField
              autoFocus
              size="small"
              value={title.draft}
              onChange={(e) => title.setDraft(e.target.value)}
              onBlur={title.commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') title.commit()
                if (e.key === 'Escape') title.cancel()
              }}
              sx={{ width: 260 }}
            />
          ) : (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 260 }}>
                {current?.title ?? 'Loading…'}
              </Typography>
              {current && isOwner ? (
                <Tooltip title="Rename song">
                  <IconButton size="small" onClick={title.start}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
          )}
          {current ? (
            <Chip
              size="small"
              variant="outlined"
              label={`${current.noteCount.toLocaleString()} note${current.noteCount === 1 ? '' : 's'}`}
            />
          ) : null}
          {current?.ownerEmail ? (
            <Chip
              size="small"
              variant="outlined"
              avatar={<Avatar>{current.ownerEmail[0]?.toUpperCase()}</Avatar>}
              label={isOwner ? 'Owned by you' : current.ownerEmail}
            />
          ) : null}

          <Box sx={{ flexGrow: 1 }} />

          {current && presence.length > 0 ? (
            <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 13 } }}>
              {presence.map((p) => (
                <Tooltip key={p.id} title={p.id === user?.id ? `${p.email} (you)` : p.email}>
                  <Avatar sx={{ bgcolor: p.id === user?.id ? 'primary.main' : 'grey.700' }}>
                    {(p.email[0] ?? '?').toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          ) : null}
          {current ? (
            <Chip
              size="small"
              icon={<CircleIcon sx={{ fontSize: 10 }} />}
              label={connected ? 'Live' : 'Offline'}
              color={connected ? 'success' : 'default'}
              variant="outlined"
            />
          ) : null}
          {readOnly ? (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<VisibilityIcon sx={{ fontSize: 14 }} />}
              label="View only"
            />
          ) : null}
          {current && canEdit ? (
            <>
              <Tooltip title="Undo (⌘Z)">
                <span>
                  <IconButton size="small" onClick={history.undo} disabled={!history.canUndo}>
                    <UndoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo (⇧⌘Z)">
                <span>
                  <IconButton size="small" onClick={history.redo} disabled={!history.canRedo}>
                    <RedoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Suggest the next note (AI)">
                <span>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={suggestions.suggest}
                    disabled={suggestions.suggesting}
                  >
                    <AutoAwesomeIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : null}
          {current && current.notes.length > 0 ? (
            <>
              <Button
                size="small"
                variant={transport.playing ? 'contained' : 'outlined'}
                color={transport.playing ? 'error' : 'primary'}
                startIcon={transport.playing ? <StopIcon /> : <PlayArrowIcon />}
                onClick={() => (transport.playing ? transport.stop() : transport.play())}
              >
                {transport.playing ? `Stop · ${transport.playhead.toFixed(1)}s` : 'Play'}
              </Button>
              <Tooltip title="Loop playback">
                <ToggleButton
                  value="loop"
                  size="small"
                  selected={transport.loop}
                  onChange={transport.toggleLoop}
                  sx={{ px: 1, py: 0.5 }}
                >
                  <RepeatIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Instrument tone">
                <Select
                  size="small"
                  value={transport.timbre}
                  onChange={(e) => transport.setTimbre(e.target.value as Timbre)}
                  sx={{ '& .MuiSelect-select': { py: 0.5 } }}
                >
                  <MenuItem value="sine">Sine</MenuItem>
                  <MenuItem value="triangle">Triangle</MenuItem>
                  <MenuItem value="square">Square</MenuItem>
                  <MenuItem value="sawtooth">Saw</MenuItem>
                </Select>
              </Tooltip>
            </>
          ) : null}
          {current && canEdit ? (
            <BpmField bpm={transport.bpm} onCommit={transport.onCommitBpm} />
          ) : null}
          {current ? (
            <Tooltip title="Share this song">
              <Button size="small" variant="outlined" startIcon={<LinkIcon />} onClick={sharing.open}>
                Share
              </Button>
            </Tooltip>
          ) : null}
          {current ? (
            <Tooltip title="More actions">
              <span>
                <IconButton
                  size="small"
                  onClick={(e) => setMoreAnchor(e.currentTarget)}
                  disabled={songActions.seeding}
                >
                  {songActions.seeding ? <CircularProgress size={18} /> : <MoreVertIcon />}
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
          <input
            ref={midi.fileInputRef}
            type="file"
            accept=".mid,.midi,audio/midi,audio/x-midi"
            style={{ display: 'none' }}
            onChange={midi.onFile}
          />
          <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={closeMore}>
            <MenuItem
              onClick={() => {
                closeMore()
                midi.exportMidi()
              }}
              disabled={midi.exporting}
            >
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export MIDI</ListItemText>
            </MenuItem>
            {canEdit ? (
              <MenuItem
                onClick={() => {
                  closeMore()
                  midi.importMidi()
                }}
                disabled={midi.importing}
              >
                <ListItemIcon>
                  <FileUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Import MIDI</ListItemText>
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                closeMore()
                setHistoryOpen(true)
              }}
            >
              <ListItemIcon>
                <HistoryIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Activity history</ListItemText>
            </MenuItem>
            {isOwner ? (
              <MenuItem
                onClick={() => {
                  closeMore()
                  songActions.openDelete()
                }}
              >
                <ListItemIcon>
                  <DeleteOutlineIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText sx={{ color: 'error.main' }}>Delete song</ListItemText>
              </MenuItem>
            ) : null}
            {showDevTools && canEdit
              ? [
                  <Divider key="dev-divider" />,
                  <MenuItem key="dev-caption" disabled sx={{ opacity: '1 !important' }}>
                    <Typography variant="caption" color="text.secondary">
                      Dev · v{current?.version ?? 0} ·{' '}
                      {(current?.notes.length ?? 0).toLocaleString()}/
                      {(current?.noteCount ?? 0).toLocaleString()} loaded
                    </Typography>
                  </MenuItem>,
                  <MenuItem
                    key="seed-1k"
                    onClick={() => {
                      closeMore()
                      songActions.seed(1000)
                    }}
                  >
                    + 1,000 notes
                  </MenuItem>,
                  <MenuItem
                    key="seed-10k"
                    onClick={() => {
                      closeMore()
                      songActions.seed(10000)
                    }}
                  >
                    + 10,000 notes
                  </MenuItem>,
                ]
              : null}
          </Menu>

          <SharePopover
            open={Boolean(sharing.anchor)}
            anchorEl={sharing.anchor}
            onClose={sharing.close}
            isOwner={isOwner}
            shareUrl={current ? `${window.location.origin}/songs/${current.id}` : ''}
            shareMode={current?.shareMode ?? 'edit'}
            onSetShare={sharing.setShare}
            onCopy={sharing.copyLink}
            inviteEmail={sharing.inviteEmail}
            onInviteEmailChange={sharing.setInviteEmail}
            inviting={sharing.inviting}
            onInvite={sharing.invite}
            collaborators={collaborators}
            onRemoveCollaborator={sharing.removeCollaborator}
          />

          <HistoryDrawer
            songId={songId}
            version={current?.version}
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        </Stack>
      </Container>
    </Box>
  )
}
