import { create } from 'zustand'

interface ChatState {
  open: boolean
  peerId: number | null
  peerName: string | null
  /** Mở widget chat trực tiếp vào cuộc hội thoại với một người. */
  openChat: (peerId: number, peerName: string) => void
  /** Bật/tắt widget; khi mở thì hiện danh sách hộp thư. */
  toggle: () => void
  /** Quay từ một cuộc hội thoại về danh sách hộp thư. */
  back: () => void
  close: () => void
  /** Xóa toàn bộ trạng thái UI chat (khi đăng xuất / đổi tài khoản). */
  reset: () => void
}

/** chatStore — Điều khiển widget chat nổi toàn cục (mở/đóng, đang xem hội thoại nào). */
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
