import GraphicEqIcon from '@mui/icons-material/GraphicEq'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsIcon from '@mui/icons-material/Settings'
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { handleLogoutApi } from '~/apis'
import { readUser } from '~/utils/session'

export function AppShell() {
  const navigate = useNavigate()
  const user = useMemo(readUser, [])
  const email = user?.email ?? ''
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)

  const logout = async () => {
    await handleLogoutApi()
    localStorage.clear()
    navigate('/login')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/songs')}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
              <GraphicEqIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              AMA-MIDI
            </Typography>
          </Stack>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={email || 'Account'}>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>
                {(email[0] ?? 'U').toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled sx={{ opacity: '1 !important' }}>
              <Typography variant="body2" color="text.secondary">
                {email || 'Signed in'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setAnchor(null)
                navigate('/settings')
              }}
            >
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={logout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Outlet />
    </Box>
  )
}
