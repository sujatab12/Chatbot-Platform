import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid token' },
        { status: 401 }
      )
    }

    // Get the specific session
    const response = await fetch(`${API_URL}/sessions/${params.id}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to fetch session' },
        { status: response.status }
      )
    }

    const session = await response.json()
    
    // Transform to frontend format
    const transformedSession = {
      id: session.id,
      agentId: session.projectId,
      messages: session.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role === 'user' ? 'user' : 'assistant',
        timestamp: msg.createdAt,
        agentId: session.projectId,
      })),
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }

    return NextResponse.json(transformedSession)
  } catch (error) {
    console.error('Get chat session API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Missing or invalid token' },
        { status: 401 }
      )
    }

    // Delete the specific session
    const response = await fetch(`${API_URL}/sessions/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Failed to delete session' },
        { status: response.status }
      )
    }

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete chat session API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
