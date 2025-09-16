'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import type { Agent } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Bot, 
  Send, 
  Plus, 
  MessageSquare, 
  User, 
  ArrowLeft,
  Loader2,
  Trash2,
  Clock
} from 'lucide-react'

function ChatPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { agents } = useAuth()
  const { 
    currentSession, 
    sessions, 
    isLoading, 
    sendMessage, 
    createNewSession, 
    loadSession, 
    deleteSession,
    getSessions,
    clearCurrentSession 
  } = useChat()

  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  useEffect(() => {
    const agentId = searchParams.get('agent')
    if (agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        setSelectedAgentId(agentId)
        handleStartNewChat(agent)
      }
    }
  }, [searchParams, agents])

  useEffect(() => {
    // Don't load sessions on initial mount - wait for agent selection
    // getSessions()
  }, [])

  // Refresh sessions when selected agent changes
  useEffect(() => {
    if (selectedAgentId) {
      getSessions(selectedAgentId)
    }
  }, [selectedAgentId])

  useEffect(() => {
    scrollToBottom()
  }, [currentSession?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartNewChat = async (agent: Agent) => {
    setSelectedAgentId(agent.id)
    
    // First, get sessions for this specific agent
    const agentSessions = await getSessions(agent.id)
    
    // Check if there's an existing session with this agent
    const existingSession = agentSessions.find(session => session.agentId === agent.id)
    
    if (existingSession) {
      // Load the last session with this agent
      await loadSession(existingSession.id)
    } else {
      // Create a new session if none exists
      await createNewSession(agent)
    }
  }

  const handleCreateNewChat = async (agent: Agent) => {
    setSelectedAgentId(agent.id)
    await createNewSession(agent)
  }

  const handleAgentChange = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      // First, get sessions for this specific agent
      await getSessions(agent.id)
      
      // Then start new chat (which will load existing session if available)
      await handleStartNewChat(agent)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedAgent || !currentSession || isLoading) return

    const messageToSend = message.trim()
    setMessage('')

    try {
      await sendMessage(messageToSend, selectedAgent)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to delete this chat session?')) {
      await deleteSession(sessionId)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (agents.length === 0) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <Card className="text-center max-w-md">
              <CardContent className="p-8">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <CardTitle className="mb-2">No Agents Available</CardTitle>
                <CardDescription className="mb-4">
                  Create your first AI agent to start chatting
                </CardDescription>
                <Button onClick={() => router.push('/agents/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="h-[calc(100vh-12rem)] flex gap-6">
          {/* Sidebar */}
          <div className="w-80 flex flex-col space-y-4">
            {/* Agent Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Select Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedAgentId} onValueChange={handleAgentChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an agent to chat with">
                      {selectedAgent ? (
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <span className="font-medium">{selectedAgent.name}</span>
                        </div>
                      ) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-gray-500 truncate">{agent.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedAgent && (
                  <div className="mt-4 space-y-2">
                    <Badge variant="outline">{selectedAgent.model}</Badge>
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleCreateNewChat(selectedAgent)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat History */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat History</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {sessions.filter(session => session.agentId === selectedAgentId).length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {selectedAgentId ? 'No chat history with this agent yet' : 'Select an agent to view chat history'}
                    </div>
                  ) : (
                    <div className="space-y-1 p-4">
                      {sessions
                        .filter(session => session.agentId === selectedAgentId)
                        .map((session) => {
                        const agent = agents.find(a => a.id === session.agentId)
                        const isActive = currentSession?.id === session.id
                        
                        return (
                          <div
                            key={session.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100'
                            }`}
                            onClick={() => loadSession(session.id)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-2">
                                <Bot className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-sm truncate">
                                  {agent?.name || 'Unknown Agent'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(session.updatedAt)}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {session.messages.length} messages
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <Card className="flex-1 flex flex-col min-h-0">
            {currentSession && selectedAgent ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bot className="h-8 w-8 text-blue-600" />
                      <div>
                        <CardTitle className="text-xl">{selectedAgent.name}</CardTitle>
                        <CardDescription>{selectedAgent.description}</CardDescription>
                      </div>
                    </div>
                    <Badge>{selectedAgent.model}</Badge>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 min-h-0">
                  <ScrollArea className="h-full max-h-[calc(100vh-20rem)]">
                    <div className="p-6 space-y-4">
                      {currentSession.messages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Start a conversation with {selectedAgent.name}</p>
                          <p className="text-sm mt-1">Type your message below to begin</p>
                        </div>
                      ) : (
                        currentSession.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                {msg.role === 'user' ? (
                                  <User className="h-4 w-4" />
                                ) : (
                                  <Bot className="h-4 w-4" />
                                )}
                                <span className="text-xs opacity-70">
                                  {formatTime(msg.timestamp)}
                                </span>
                              </div>
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bot className="h-4 w-4" />
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                <Separator />

                {/* Message Input */}
                <div className="p-6 flex-shrink-0">
                  <div className="flex space-x-2">
                    <Input
                      placeholder={`Message ${selectedAgent.name}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {!selectedAgentId ? 'Select an Agent' : 'Start a Conversation'}
                  </h3>
                  <p className="text-gray-500">
                    {!selectedAgentId 
                      ? 'Choose an agent from the sidebar to begin chatting'
                      : 'Click "New Chat" to start a conversation'
                    }
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading chat...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    }>
      <ChatPageContent />
    </Suspense>
  )
}