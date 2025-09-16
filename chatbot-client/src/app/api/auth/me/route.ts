import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid token' },
        { status: 401 }
      )
    }

    // First try to get user info with the access token
    let response = await fetch(`${API_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    })

    // If access token is expired, try to refresh it
    if (response.status === 401) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // This will send the refresh token cookie
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        
        // Return the new access token and user data
        return NextResponse.json({
          user: refreshData.user,
          accessToken: refreshData.accessToken
        })
      } else {
        // Refresh failed, return unauthorized
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Me API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
