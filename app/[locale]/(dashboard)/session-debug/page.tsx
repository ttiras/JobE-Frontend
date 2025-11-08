'use client'

import { useEffect, useState } from 'react'
import { useNhostClient } from '@/components/providers/nhost-provider'

export default function SessionDebugPage() {
  const nhost = useNhostClient()
  const [cookies, setCookies] = useState<string>('')
  const [session, setSession] = useState<unknown>(null)
  
  useEffect(() => {
    // Update state asynchronously to avoid synchronous setState in effect
    const updateState = () => {
      setCookies(document.cookie)
      setSession(nhost.getUserSession())
    }
    
    // Initial update deferred
    const timeoutId = setTimeout(updateState, 0)
    
    // Re-check every second
    const interval = setInterval(updateState, 1000)
    
    return () => {
      clearTimeout(timeoutId)
      clearInterval(interval)
    }
  }, [nhost])
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded">
          <h2 className="font-bold mb-2">Cookies:</h2>
          <pre className="whitespace-pre-wrap break-all text-xs">
            {cookies || 'No cookies found'}
          </pre>
        </div>
        
        <div className="bg-muted p-4 rounded">
          <h2 className="font-bold mb-2">Nhost Session:</h2>
          <pre className="whitespace-pre-wrap text-xs">
            {JSON.stringify(session, null, 2) || 'No session'}
          </pre>
        </div>
        
        <div className="bg-muted p-4 rounded">
          <h2 className="font-bold mb-2">Storage Type:</h2>
          <p className="text-sm">
            Check if nhostSession cookie persists after page refresh
          </p>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}
