'use client'

import { useEffect, useState } from 'react'
import { Network, type ConnectionStatus } from '@capacitor/network'
import { isNativePlatform } from '@/lib/mobile'

export function useNetworkStatus(): ConnectionStatus | null {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)

  useEffect(() => {
    if (!isNativePlatform()) {
      return
    }

    let removeListener: (() => void) | undefined

    const setup = async () => {
      const current = await Network.getStatus()
      setStatus(current)

      const handle = await Network.addListener('networkStatusChange', next => {
        setStatus(next)
      })
      removeListener = () => handle.remove()
    }

    void setup()

    return () => {
      removeListener?.()
    }
  }, [])

  return status
}
