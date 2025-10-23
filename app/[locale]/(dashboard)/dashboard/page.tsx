'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    if (error === 'insufficient_permissions') {
      toast.error('Insufficient Permissions', {
        description: 'You do not have access to the requested page.',
        icon: <AlertCircle className="h-4 w-4" />,
      })
    }
  }, [error])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to JobE HR Management Platform
      </p>
    </div>
  )
}

