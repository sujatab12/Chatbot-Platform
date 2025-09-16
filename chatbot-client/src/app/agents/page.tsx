'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bot, 
  Plus, 
  Search, 
  MessageSquare, 
  Eye, 
  Share, 
  Calendar, 
  MoreVertical,
  Filter,
  Grid,
  List
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function AgentsPage() {
  const { agents, deleteAgent } = useAuth()
  const { handleAgentDeleted } = useChat()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [modelFilter, setModelFilter] = useState('all')
  const [visibilityFilter, setVisibilityFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesModel = modelFilter === 'all' || agent.model.toLowerCase() === modelFilter.toLowerCase()
    
    const matchesVisibility = visibilityFilter === 'all' ||
                             (visibilityFilter === 'public' && agent.isPublic) ||
                             (visibilityFilter === 'private' && !agent.isPublic)
    
    return matchesSearch && matchesModel && matchesVisibility
  })

  const handleChatWithAgent = (agentId: string) => {
    router.push(`/chat?agent=${agentId}`)
  }

  const handleShareAgent = async (agent: any) => {
    try {
      const shareUrl = `${window.location.origin}/agents/public/${agent.shareUrl}`
      await navigator.clipboard.writeText(shareUrl)
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
      case 'gpt-4': return 'bg-green-100 text-green-800'
      case 'gpt-3.5-turbo': return 'bg-blue-100 text-blue-800'
      case 'claude': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const uniqueModels = Array.from(new Set(agents.map(agent => agent.model)))

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
              <p className="text-gray-600 mt-1">
                Manage all your AI agents in one place
              </p>
            </div>
            <Button onClick={() => router.push('/agents/new')} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Agent
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Model Filter */}
              <Select value={modelFilter} onValueChange={setModelFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueModels.map(model => (
                    <SelectItem key={model} value={model.toLowerCase()}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Visibility Filter */}
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} found
          </div>

          {/* Agents Grid/List */}
          {filteredAgents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <CardTitle className="mb-2">No agents found</CardTitle>
                <CardDescription className="mb-4">
                  {searchQuery || modelFilter !== 'all' || visibilityFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'Create your first AI agent to get started'
                  }
                </CardDescription>
                {!(searchQuery || modelFilter !== 'all' || visibilityFilter !== 'all') && (
                  <Button onClick={() => router.push('/agents/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Agent
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
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
          ) : (
            <div className="space-y-4">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Bot className="h-8 w-8 text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {agent.name}
                          </h3>
                          <p className="text-gray-600 truncate">{agent.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge className={getModelBadgeColor(agent.model)}>
                              {agent.model}
                            </Badge>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(agent.createdAt).toLocaleDateString()}
                            </div>
                            {agent.isPublic && (
                              <div className="flex items-center text-sm text-green-600">
                                <Eye className="h-3 w-3 mr-1" />
                                Public
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          size="sm"
                          onClick={() => handleChatWithAgent(agent.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleShareAgent(agent)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
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
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteAgent(agent.id)}
                            >
                              Delete Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}