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

/** Which dashboard "section" a notification belongs to (for per-menu badges). */
export type NotifSection = 'orders' | 'shop' | 'wallet' | 'printing' | 'other'

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
 * Central notification state for the current account. Polls the backend so the
 * bell badge and per-menu counts stay fresh. Grouping of UNREAD notifications by
 * section powers the little count badges next to each menu item.
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

  const markRead = async (id: number) => {
    try { await apiClient.put(`/notifications/${id}/read`) } finally { invalidate() }
  }

  const markAllRead = async () => {
    try { await apiClient.put('/notifications/read-all') } finally { invalidate() }
  }

  return { unreadTotal, list, counts, markRead, markAllRead }
}

export default useNotifications
