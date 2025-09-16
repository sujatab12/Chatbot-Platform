'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, MessageSquare, Eye, Share, Calendar, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, agents, deleteAgent } = useAuth()
  const { handleAgentDeleted } = useChat()
  const router = useRouter()

  const handleChatWithAgent = (agentId: string) => {
    router.push(`/chat?agent=${agentId}`)
  }

  const handleShareAgent = async (agent: any) => {
    try {
      const shareUrl = `${window.location.origin}/agents/public/${agent.shareUrl}`
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
      alert('Share link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy share link:', error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteAgent(agentId)
        handleAgentDeleted(agentId)
        // Show success message
        alert('Agent deleted successfully!')
      } catch (error) {
        console.error('Failed to delete agent:', error)
        alert(`Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const getModelBadgeColor = (model: string) => {
    switch (model.toLowerCase()) {
      case 'gpt-5': return 'bg-purple-100 text-purple-800'
      case 'gpt-4o': return 'bg-blue-100 text-blue-800'
      case 'gpt-4o-mini': return 'bg-green-100 text-green-800'
      case 'gpt-4': return 'bg-green-100 text-green-800'
      case 'gpt-3.5-turbo': return 'bg-blue-100 text-blue-800'
      case 'claude': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your AI agents and chat with them instantly
              </p>
            </div>
            <Button onClick={() => router.push('/agents/new')} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {agents.filter(a => a.isPublic).length} public
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Start chatting with your agents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Public agent interactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Agents Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Agents</h2>
              <Link href="/agents">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            {agents.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <CardTitle className="mb-2">No agents yet</CardTitle>
                  <CardDescription className="mb-4">
                    Create your first AI agent to get started building intelligent conversations
                  </CardDescription>
                  <Button onClick={() => router.push('/agents/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Agent
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.slice(0, 6).map((agent) => (
                  <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Bot className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/agents/${agent.id}/edit`)}>
                              Edit Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShareAgent(agent)}>
                              Share Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              Delete Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {agent.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className={getModelBadgeColor(agent.model)}>
                          {agent.model}
                        </Badge>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleChatWithAgent(agent.id)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareAgent(agent)}
                        >
                          <Share className="h-3 w-3" />
                        </Button>
                      </div>

                      {agent.isPublic && (
                        <div className="flex items-center mt-2 text-xs text-green-600">
                          <Eye className="h-3 w-3 mr-1" />
                          Public
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}