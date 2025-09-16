'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect if we're absolutely sure the user is not authenticated
    // This prevents false redirects on page refresh
    if (!isLoading && !user) {
      // Check if there's a token in localStorage
      const token = localStorage.getItem('auth_token')
      if (!token) {
        // Only redirect if there's definitely no token
        router.push('/auth/login')
      }
      // If there's a token but no user, wait for auth to complete
      // This handles the case where the page refreshes and auth is still loading
    }
  }, [user, isLoading, router])

  // Show loading if we're still loading OR if we have a token but no user yet
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token')
  const shouldShowLoading = isLoading || (hasToken && !user)

  // Add a timeout to prevent infinite loading
  const [showTimeout, setShowTimeout] = useState(false)
  
  useEffect(() => {
    if (shouldShowLoading) {
      const timeout = setTimeout(() => {
        setShowTimeout(true)
      }, 10000) // 10 second timeout
      
      return () => clearTimeout(timeout)
    } else {
      setShowTimeout(false)
    }
  }, [shouldShowLoading])

  if (shouldShowLoading && !showTimeout) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If we've been loading too long, show an error or redirect
  if (showTimeout) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Loading took too long. Please try again.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}