import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, agent, sessionId } = body

    // Use the agent ID as project ID for the backend
    const response = await fetch(`${API_URL}/projects/${agent.id}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify({ 
        content: message,
        sessionId: sessionId 
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      content: data.reply,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
