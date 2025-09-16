import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export async function PUT(
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

    const body = await request.json()
    
    // Transform agent data to project format
    const projectData = {
      name: body.name,
      instructions: body.prompt || body.description || '',
      model: body.model || 'gpt-4o-mini',
      isPublic: body.isPublic || false,
    }

    const response = await fetch(`${API_URL}/projects/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      credentials: 'include',
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    const project = await response.json()
    
    // Transform project back to agent format
    const agent = {
      id: project.id,
      name: project.name,
      description: project.instructions || '',
      model: project.model || 'gpt-4o-mini',
      prompt: project.instructions || '',
      isPublic: project.isPublic || false,
      shareUrl: project.shareUrl || `share_${project.id}`,
      userId: project.userId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Update agent API error:', error)
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

    const response = await fetch(`${API_URL}/projects/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(errorData, { status: response.status })
    }

    return NextResponse.json({ message: 'Agent deleted successfully' })
  } catch (error) {
    console.error('Delete agent API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
