'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  model: string
  prompt: string
  isPublic: boolean
  shareUrl: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  agents: Agent[]
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  createAgent: (agent: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'shareUrl'>) => Promise<Agent>
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>
  deleteAgent: (id: string) => Promise<void>
  getPublicAgent: (shareUrl: string) => Promise<Agent | null>
  refreshAgents: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const token = localStorage.getItem('auth_token')
      console.log('checkAuth: token exists:', !!token)
      
      if (!token) {
        console.log('checkAuth: no token, setting loading false')
        setIsLoading(false)
        return
      }

      console.log('checkAuth: making request to /api/auth/me')
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('checkAuth: response status:', response.status)

      if (response.ok) {
        const userData = await response.json()
        console.log('checkAuth: user data received:', userData)
        setUser(userData.user)
        
        // If we got a new access token, update it in localStorage
        if (userData.accessToken) {
          console.log('checkAuth: updating access token')
          localStorage.setItem('auth_token', userData.accessToken)
        }
        
        await fetchAgents()
      } else if (response.status === 401) {
        console.log('checkAuth: 401 unauthorized, clearing auth data')
        // Only clear auth data on 401 (unauthorized)
        localStorage.removeItem('auth_token')
        setUser(null)
        setAgents([])
      } else {
        // For other errors, keep the user logged in but log the error
        console.error('Auth check failed with status:', response.status)
        // Don't clear auth data for non-401 errors
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Don't clear auth data on network errors - keep user logged in
      // This prevents redirect to login on temporary network issues
    } finally {
      console.log('checkAuth: setting loading false')
      setIsLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      })
      
      if (response.ok) {
        const agentsData = await response.json()
        setAgents(agentsData)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const { token, user: userData } = await response.json()
      localStorage.setItem('auth_token', token)
      setUser(userData)
      await fetchAgents()
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.')
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Signup failed')
      }

      const { token, user: userData } = await response.json()
      localStorage.setItem('auth_token', token)
      setUser(userData)
      setAgents([])
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Signup failed. Please try again.')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setAgents([])
  }

  const createAgent = async (agentData: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'shareUrl'>): Promise<Agent> => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(agentData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create agent')
      }

      const newAgent = await response.json()
      setAgents(prev => [...prev, newAgent])
      return newAgent
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create agent')
    }
  }

  const updateAgent = async (id: string, updates: Partial<Agent>): Promise<Agent> => {
    try {
      console.log('Updating agent with ID:', id, 'Updates:', updates)
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updates)
      })

      console.log('Update response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update error response:', errorData)
        throw new Error(errorData.message || 'Failed to update agent')
      }

      const updatedAgent = await response.json()
      console.log('Agent updated successfully:', updatedAgent)
      setAgents(prev => prev.map(agent => agent.id === id ? updatedAgent : agent))
      return updatedAgent
    } catch (error) {
      console.error('Update agent error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to update agent')
    }
  }

  const deleteAgent = async (id: string): Promise<void> => {
    try {
      console.log('Deleting agent with ID:', id)
      const response = await fetch(`/api/agents/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      console.log('Delete response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Delete error response:', errorData)
        throw new Error(errorData.message || 'Failed to delete agent')
      }

      console.log('Agent deleted successfully, updating local state')
      setAgents(prev => prev.filter(agent => agent.id !== id))
      
      // Notify chat context about the deleted agent
      // This will be handled by the components that use both contexts
    } catch (error) {
      console.error('Delete agent error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to delete agent')
    }
  }

  const getPublicAgent = async (shareUrl: string): Promise<Agent | null> => {
    try {
      const response = await fetch(`/api/agents/public/${shareUrl}`)
      
      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch public agent:', error)
      return null
    }
  }

  const refreshAgents = async () => {
    await fetchAgents()
  }

  const refreshAuth = async () => {
    setIsLoading(true)
    await checkAuth()
  }

  return (
    <AuthContext.Provider value={{
      user,
      agents,
      isLoading,
      login,
      signup,
      logout,
      createAgent,
      updateAgent,
      deleteAgent,
      getPublicAgent,
      refreshAgents,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}