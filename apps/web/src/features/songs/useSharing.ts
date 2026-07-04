import { useState } from 'react'
import type { MouseEvent } from 'react'
import { toast } from 'react-toastify'

import { inviteCollaboratorApi, removeCollaboratorApi } from '~/apis/midi'
import { useAppDispatch } from '~/store/hooks'
import { applyCollaboratorRemoved, applyCollaboratorUpsert, setShareMode } from '~/store/songSlice'

interface Song {
  id: string
  shareMode: 'edit' | 'view'
}

export function useSharing(current: Song | null) {
  const dispatch = useAppDispatch()
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const open = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)
  const close = () => setAnchor(null)

  const copyLink = async () => {
    if (!current) return
    const url = `${window.location.origin}/songs/${current.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invite link copied — send it to a collaborator')
    } catch {
      toast.info(url)
    }
  }

  const invite = async () => {
    const email = inviteEmail.trim()
    if (!current || !email) return
    setInviting(true)
    try {
      const collaborator = await inviteCollaboratorApi(current.id, email)
      dispatch(applyCollaboratorUpsert({ songId: current.id, collaborator }))
      toast.success(`Invited ${collaborator.email}`)
      setInviteEmail('')
    } catch {
      /* interceptor surfaces the error */
    } finally {
      setInviting(false)
    }
  }

  const removeCollaborator = async (collaboratorId: string, collaboratorEmail: string) => {
    if (!current) return
    try {
      await removeCollaboratorApi(current.id, collaboratorId)
      dispatch(applyCollaboratorRemoved({ songId: current.id, userId: collaboratorId }))
      toast.success(`Removed ${collaboratorEmail}`)
    } catch {
      /* interceptor surfaces the error */
    }
  }

  const setShare = async (mode: 'edit' | 'view') => {
    if (!current || current.shareMode === mode) return
    const res = await dispatch(setShareMode({ id: current.id, shareMode: mode }))
    if (setShareMode.fulfilled.match(res)) {
      toast.success(mode === 'view' ? 'Song is now view-only' : 'Anyone with the link can edit')
    }
  }

  return {
    anchor,
    open,
    close,
    inviteEmail,
    setInviteEmail,
    inviting,
    copyLink,
    invite,
    removeCollaborator,
    setShare,
  }
}
