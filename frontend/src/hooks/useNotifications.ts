import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '../api/axios'
import useAuth from './useAuth'

export interface NotificationItem {
  notificationId: number
  title: string
  message: string
  notificationType: string
  relatedEntityType?: string
  relatedEntityId?: number
  isRead: boolean
  readAt?: string
  createdAt: string
}

/** Thông báo thuộc "mục" nào của dashboard (để hiện badge đếm theo từng menu). */
export type NotifSection = 'orders' | 'shop' | 'wallet' | 'printing' | 'other'

/** Suy ra mục của một thông báo dựa trên loại thực thể liên quan. */
export function sectionOf(relatedType?: string): NotifSection {
  const t = (relatedType ?? '').toUpperCase()
  if (t === 'ORDER') return 'orders'
  if (t === 'WITHDRAWAL') return 'wallet'
  if (t === 'SELLER_APPLICATION') return 'shop'
  if (t.startsWith('PRINTING')) return 'printing'
  return 'other'
}

export interface SectionCounts {
  orders: number
  shop: number
  wallet: number
  printing: number
  other: number
}

const REFETCH_MS = 20_000

/**
 * useNotifications — Trạng thái thông báo tập trung cho tài khoản hiện tại.
 * Poll backend định kỳ để badge chuông và số đếm theo menu luôn mới; nhóm các thông báo
 * CHƯA ĐỌC theo mục để hiện badge nhỏ cạnh từng mục menu.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()

  const { data: unreadTotal = 0 } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count')
      return (res.data.data?.unreadCount ?? 0) as number
    },
    enabled: isAuthenticated,
    refetchInterval: REFETCH_MS,
  })

  const { data: list = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications', { params: { page: 0, size: 30 } })
      return res.data.data?.content ?? []
    },
    enabled: isAuthenticated,
    refetchInterval: REFETCH_MS,
  })

  const counts = useMemo<SectionCounts>(() => {
    const c: SectionCounts = { orders: 0, shop: 0, wallet: 0, printing: 0, other: 0 }
    for (const n of list) {
      if (n.isRead) continue
      c[sectionOf(n.relatedEntityType)]++
    }
    return c
  }, [list])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['notifications'] })
    void qc.invalidateQueries({ queryKey: ['notif-unread-count'] })
  }

  /** Đánh dấu một thông báo đã đọc rồi làm mới. */
  const markRead = async (id: number) => {
    try { await apiClient.put(`/notifications/${id}/read`) } finally { invalidate() }
  }

  /** Đánh dấu tất cả thông báo đã đọc rồi làm mới. */
  const markAllRead = async () => {
    try { await apiClient.put('/notifications/read-all') } finally { invalidate() }
  }

  return { unreadTotal, list, counts, markRead, markAllRead }
}

export default useNotifications
