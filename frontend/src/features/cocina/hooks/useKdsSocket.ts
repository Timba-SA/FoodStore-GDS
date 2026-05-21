import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore, selectAccessToken } from '@/features/auth/store/authStore'
import { KDS_ORDERS_KEY } from '../api/cocinaApi'
import { playKdsAlert } from '../utils/audioAlert'
import type { WsMessage } from '../types'

export function useKdsSocket() {
  const [isConnectionHealthy, setIsConnectionHealthy] = useState(false)
  const token = useAuthStore(selectAccessToken)
  const queryClient = useQueryClient()

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectDelayRef = useRef(1000)
  const maxReconnectDelay = 30000
  const pollingIntervalRef = useRef<number | null>(null)

  const connectWs = () => {
    if (!token) return

    if (socketRef.current) {
      socketRef.current.close()
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const apiVersion = import.meta.env.VITE_API_VERSION || 'v1'
    let wsProtocol = 'ws:'
    let wsHost = 'localhost:8000'

    if (apiBase.startsWith('https://')) {
      wsProtocol = 'wss:'
      wsHost = apiBase.replace('https://', '').split('/')[0]
    } else if (apiBase.startsWith('http://')) {
      wsProtocol = 'ws:'
      wsHost = apiBase.replace('http://', '').split('/')[0]
    } else {
      wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsHost = window.location.host
    }

    const wsUrl = `${wsProtocol}//${wsHost}/api/${apiVersion}/cocina/ws?token=${token}`

    try {
      const ws = new WebSocket(wsUrl)
      socketRef.current = ws

      ws.onopen = () => {
        setIsConnectionHealthy(true)
        reconnectDelayRef.current = 1000
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
        
        // Immediately fetch fresh orders on connection success to ensure sync
        queryClient.invalidateQueries({ queryKey: [KDS_ORDERS_KEY] })
      }

      ws.onmessage = (event) => {
        try {
          const wsMessage = JSON.parse(event.data) as WsMessage
          
          // Invalidate TanStack Query orders list
          queryClient.invalidateQueries({ queryKey: [KDS_ORDERS_KEY] })
          queryClient.invalidateQueries({ queryKey: ['pedidos'] })
          queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })

          // Play programmatic alert sound for new/updated active kitchen orders
          if (
            wsMessage.payload?.event === 'pedido_creado' ||
            wsMessage.payload?.event === 'pedido_actualizado'
          ) {
            playKdsAlert()
          }
        } catch (err) {
          console.error('KDS WS: Error parsing websocket message:', err)
          queryClient.invalidateQueries({ queryKey: [KDS_ORDERS_KEY] })
        }
      }

      ws.onclose = (event) => {
        setIsConnectionHealthy(false)
        socketRef.current = null
        
        // Reconnect if not a graceful component unmount
        if (event.code !== 1000 && event.code !== 1008) {
          scheduleReconnect()
        }
      }

      ws.onerror = (err) => {
        console.error('KDS WS: Connection error:', err)
        ws.close()
      }
    } catch (err) {
      console.error('KDS WS: Failed to create WebSocket instance:', err)
      setIsConnectionHealthy(false)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return

    const delay = reconnectDelayRef.current
    reconnectDelayRef.current = Math.min(delay * 2, maxReconnectDelay)

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null
      connectWs()
    }, delay)
  }

  useEffect(() => {
    connectWs()

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, 'Component unmounted')
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [token])

  useEffect(() => {
    if (!isConnectionHealthy) {
      pollingIntervalRef.current = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: [KDS_ORDERS_KEY] })
      }, 30000)
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isConnectionHealthy, queryClient])

  return {
    isConnectionHealthy,
    reconnectNow: connectWs
  }
}
