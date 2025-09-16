'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import type { Agent } from './AuthContext'

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  agentId: string
}

export interface ChatSession {
  id: string
  agentId: string
  messages: ChatMessage[]
  title: string
  createdAt: string
  updatedAt: string
}

interface ChatContextType {
  currentSession: ChatSession | null
  sessions: ChatSession[]
  isLoading: boolean
  sendMessage: (content: string, agent: Agent) => Promise<void>
  createNewSession: (agent: Agent) => Promise<ChatSession>
  loadSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  getSessions: (agentId?: string) => Promise<ChatSession[]>
  clearCurrentSession: () => void
  handleAgentDeleted: (agentId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = useCallback(async (content: string, agent: Agent) => {
    if (!currentSession) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      agentId: agent.id
    }

    // Optimistically add user message
    setCurrentSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, userMessage]
    } : null)

    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: content,
          agent: agent,
          sessionId: currentSession.id,
          conversationHistory: currentSession.messages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get response')
      }

      const aiResponse = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        content: aiResponse.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        agentId: agent.id
      }

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      } : null)

      // Update sessions list
      setSessions(prev => prev.map(session => 
        session.id === currentSession.id 
          ? { ...session, messages: [...session.messages, userMessage, assistantMessage], updatedAt: new Date().toISOString() }
          : session
      ))

    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        agentId: agent.id
      }

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage]
      } : null)
    } finally {
      setIsLoading(false)
    }
  }, [currentSession])

  const createNewSession = useCallback(async (agent: Agent): Promise<ChatSession> => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          agentId: agent.id,
          title: `Chat with ${agent.name}`
        })
      })

      if (response.ok) {
        const savedSession = await response.json()
        setSessions(prev => [savedSession, ...prev])
        setCurrentSession(savedSession)
        return savedSession
      }
    } catch (error) {
      console.error('Failed to create session:', error)
    }

    // Fallback to local session
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      agentId: agent.id,
      messages: [],
      title: `Chat with ${agent.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setSessions(prev => [newSession, ...prev])
    setCurrentSession(newSession)
    return newSession
  }, [])

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const session = await response.json()
        setCurrentSession(session)
      } else {
        // Fallback to local session
        const localSession = sessions.find(s => s.id === sessionId)
        if (localSession) {
          setCurrentSession(localSession)
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      const localSession = sessions.find(s => s.id === sessionId)
      if (localSession) {
        setCurrentSession(localSession)
      }
    }
  }, [sessions])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        console.error('Failed to delete session on server')
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }

    setSessions(prev => prev.filter(s => s.id !== sessionId))
    if (currentSession?.id === sessionId) {
      setCurrentSession(null)
    }
  }, [currentSession])

  const getSessions = useCallback(async (agentId?: string): Promise<ChatSession[]> => {
    try {
      const url = agentId ? `/api/chat/sessions?agentId=${agentId}` : '/api/chat/sessions'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const sessionsData = await response.json()
        setSessions(sessionsData)
        return sessionsData
      } else {
        console.error('Failed to get sessions from server')
        return []
      }
    } catch (error) {
      console.error('Failed to get sessions:', error)
      return []
    }
  }, [])

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null)
  }, [])

  const handleAgentDeleted = useCallback((agentId: string) => {
    // Remove all sessions for the deleted agent
    setSessions(prev => prev.filter(session => session.agentId !== agentId))
    
    // Clear current session if it belongs to the deleted agent
    if (currentSession?.agentId === agentId) {
      setCurrentSession(null)
    }
  }, [currentSession])

  return (
    <ChatContext.Provider value={{
      currentSession,
      sessions,
      isLoading,
      sendMessage,
      createNewSession,
      loadSession,
      deleteSession,
      getSessions,
      clearCurrentSession,
      handleAgentDeleted
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}