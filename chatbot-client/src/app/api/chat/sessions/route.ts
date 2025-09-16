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

    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    if (!agentId) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Get sessions for the agent (project)
    const response = await fetch(`${API_URL}/sessions/project/${agentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch sessions' },
        { status: response.status }
      )
    }

    const sessions = await response.json()
    
    // Transform sessions to frontend format
    const transformedSessions = sessions.map((session: any) => ({
      id: session.id,
      agentId: agentId,
      messages: session.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: msg.createdAt,
        agentId: agentId,
      })),
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }))

    return NextResponse.json(transformedSessions)
  } catch (error) {
    console.error('Get chat sessions API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { agentId, title } = body
    
    if (!agentId) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Create a new session
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify({
        projectId: agentId,
        title: title || `Chat with Agent ${agentId}`,
      }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to create session' },
        { status: response.status }
      )
    }

    const session = await response.json()
    
    // Transform to frontend format
    const transformedSession = {
      id: session.id,
      agentId: agentId,
      messages: session.messages || [],
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }

    return NextResponse.json(transformedSession)
  } catch (error) {
    console.error('Create chat session API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
