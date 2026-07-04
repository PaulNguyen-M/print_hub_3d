import { create } from 'zustand'

interface ChatState {
  open: boolean
  peerId: number | null
  peerName: string | null
  /** Open the widget directly on a conversation with a peer. */
  openChat: (peerId: number, peerName: string) => void
  /** Toggle the widget; when opening, show the inbox list. */
  toggle: () => void
  /** Go back from a conversation to the inbox list. */
  back: () => void
  close: () => void
  /** Clear all chat UI state (on logout / account switch). */
  reset: () => void
}

/** Controls the global floating chat widget. */
export const useChatStore = create<ChatState>((set) => ({
  open: false,
  peerId: null,
  peerName: null,
  openChat: (peerId, peerName) => set({ open: true, peerId, peerName }),
  toggle: () => set((s) => (s.open ? { open: false } : { open: true, peerId: null, peerName: null })),
  back: () => set({ peerId: null, peerName: null }),
  close: () => set({ open: false }),
  reset: () => set({ open: false, peerId: null, peerName: null }),
}))
