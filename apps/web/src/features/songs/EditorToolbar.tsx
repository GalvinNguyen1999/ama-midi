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
import type { ChangeEvent, MouseEvent, RefObject } from 'react'

import { HistoryDrawer } from '~/features/songs/HistoryDrawer'
import { SharePopover } from '~/features/songs/SharePopover'
import type { Timbre } from '~/features/songs/usePlayback'
import type { useSharing } from '~/features/songs/useSharing'
import type { useSongActions } from '~/features/songs/useSongActions'
import type { useSongTitle } from '~/features/songs/useSongTitle'
import type { Collaborator, SongWithNotes } from '~/types/midi'

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

  title: ReturnType<typeof useSongTitle>
  sharing: ReturnType<typeof useSharing>
  songActions: ReturnType<typeof useSongActions>

  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean

  suggest: () => void
  suggesting: boolean

  playing: boolean
  playhead: number
  onPlay: () => void
  onStop: () => void
  loop: boolean
  onToggleLoop: () => void
  timbre: Timbre
  onTimbreChange: (t: Timbre) => void

  fileInputRef: RefObject<HTMLInputElement | null>
  onFile: (e: ChangeEvent<HTMLInputElement>) => void
  exportMidi: () => void
  exporting: boolean
  importMidi: () => void
  importing: boolean

  moreAnchor: HTMLElement | null
  onOpenMore: (e: MouseEvent<HTMLElement>) => void
  onCloseMore: () => void

  historyOpen: boolean
  onOpenHistory: () => void
  onCloseHistory: () => void

  showDevTools: boolean
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
  title,
  sharing,
  songActions,
  undo,
  redo,
  canUndo,
  canRedo,
  suggest,
  suggesting,
  playing,
  playhead,
  onPlay,
  onStop,
  loop,
  onToggleLoop,
  timbre,
  onTimbreChange,
  fileInputRef,
  onFile,
  exportMidi,
  exporting,
  importMidi,
  importing,
  moreAnchor,
  onOpenMore,
  onCloseMore,
  historyOpen,
  onOpenHistory,
  onCloseHistory,
  showDevTools,
}: Props) {
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
                  <IconButton size="small" onClick={undo} disabled={!canUndo}>
                    <UndoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Redo (⇧⌘Z)">
                <span>
                  <IconButton size="small" onClick={redo} disabled={!canRedo}>
                    <RedoIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Suggest the next note (AI)">
                <span>
                  <IconButton size="small" color="secondary" onClick={suggest} disabled={suggesting}>
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
                variant={playing ? 'contained' : 'outlined'}
                color={playing ? 'error' : 'primary'}
                startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
                onClick={playing ? onStop : onPlay}
              >
                {playing ? `Stop · ${playhead.toFixed(1)}s` : 'Play'}
              </Button>
              <Tooltip title="Loop playback">
                <ToggleButton
                  value="loop"
                  size="small"
                  selected={loop}
                  onChange={onToggleLoop}
                  sx={{ px: 1, py: 0.5 }}
                >
                  <RepeatIcon fontSize="small" />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Instrument tone">
                <Select
                  size="small"
                  value={timbre}
                  onChange={(e) => onTimbreChange(e.target.value as Timbre)}
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
                <IconButton size="small" onClick={onOpenMore} disabled={songActions.seeding}>
                  {songActions.seeding ? <CircularProgress size={18} /> : <MoreVertIcon />}
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi,audio/midi,audio/x-midi"
            style={{ display: 'none' }}
            onChange={onFile}
          />
          <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={onCloseMore}>
            <MenuItem
              onClick={() => {
                onCloseMore()
                exportMidi()
              }}
              disabled={exporting}
            >
              <ListItemIcon>
                <FileDownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export MIDI</ListItemText>
            </MenuItem>
            {canEdit ? (
              <MenuItem
                onClick={() => {
                  onCloseMore()
                  importMidi()
                }}
                disabled={importing}
              >
                <ListItemIcon>
                  <FileUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Import MIDI</ListItemText>
              </MenuItem>
            ) : null}
            <MenuItem
              onClick={() => {
                onCloseMore()
                onOpenHistory()
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
                  onCloseMore()
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
                      onCloseMore()
                      songActions.seed(1000)
                    }}
                  >
                    + 1,000 notes
                  </MenuItem>,
                  <MenuItem
                    key="seed-10k"
                    onClick={() => {
                      onCloseMore()
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
            onClose={onCloseHistory}
          />
        </Stack>
      </Container>
    </Box>
  )
}
