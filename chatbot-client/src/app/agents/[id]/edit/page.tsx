'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/contexts/ChatContext'
import type { Agent } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Bot, Save, ArrowLeft, Loader2, Lightbulb, Trash2 } from 'lucide-react'

interface EditAgentPageProps {
  params: {
    id: string
  }
}

const AI_MODELS = [
  { value: 'gpt-5', label: 'GPT-5', description: 'Latest and most advanced OpenAI model' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Multimodal model with vision capabilities' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini', description: 'Faster and more cost-effective version of GPT-4o' }
]

export default function EditAgentPage({ params }: EditAgentPageProps) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const { agents, updateAgent, deleteAgent } = useAuth()
  const { handleAgentDeleted } = useChat()
  const router = useRouter()

  useEffect(() => {
    // Only proceed if agents have been loaded (not empty array from initial state)
    if (agents.length === 0) return
    
    const foundAgent = agents.find(a => a.id === params.id)
    if (foundAgent) {
      setAgent(foundAgent)
      setName(foundAgent.name)
      setDescription(foundAgent.description)
      setModel(foundAgent.model)
      setPrompt(foundAgent.prompt)
      setIsPublic(foundAgent.isPublic)
    } else {
      // Agent not found, redirect to agents page
      console.log('Agent not found, redirecting to agents page')
      router.push('/agents')
    }
  }, [agents, params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted, event:', e.type)

    if (!agent) return

    if (!name.trim() || !description.trim() || !model || !prompt.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      console.log('Submitting agent update:', {
        name: name.trim(),
        description: description.trim(),
        model,
        prompt: prompt.trim(),
        isPublic
      })
      
      await updateAgent(agent.id, {
        name: name.trim(),
        description: description.trim(),
        model,
        prompt: prompt.trim(),
        isPublic
      })
      
      console.log('Agent updated successfully, redirecting to agents page')
      router.push('/agents')
    } catch (err) {
      console.error('Update agent error:', err)
      setError(err instanceof Error ? err.message : 'Failed to update agent')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!agent) return

    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      console.log('Deleting agent from edit page:', agent.id)
      await deleteAgent(agent.id)
      handleAgentDeleted(agent.id)
      console.log('Agent deleted successfully, redirecting to agents page')
      router.push('/agents')
    } catch (err) {
      console.error('Delete agent error in edit page:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete agent')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!agent && agents.length > 0) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h1>
            <p className="text-gray-600 mb-6">The agent you're trying to edit doesn't exist.</p>
            <Button onClick={() => router.push('/agents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Agents
            </Button>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!agent) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="max-w-4xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agent...</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Agent</h1>
                <p className="text-gray-600 mt-1">
                  Update your agent's configuration and behavior
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Agent
                </>
              )}
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
                <CardDescription>
                  Update your agent's name and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Support Bot, Writing Assistant"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your agent does and how it can help users"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSaving || isDeleting}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">AI Model *</Label>
                  <Select 
                    value={model} 
                    onValueChange={(value) => {
                      console.log('Model changed to:', value)
                      setModel(value)
                    }} 
                    disabled={isSaving || isDeleting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((modelOption) => (
                        <SelectItem key={modelOption.value} value={modelOption.value}>
                          <div>
                            <div className="font-medium">{modelOption.label}</div>
                            <div className="text-sm text-gray-500">{modelOption.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Agent Instructions</span>
                </CardTitle>
                <CardDescription>
                  Define your agent's personality, behavior, and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">System Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="You are a helpful assistant that..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isSaving || isDeleting}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-gray-500">
                    This prompt defines your agent's behavior, personality, and capabilities. Be specific about how it should respond to users.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sharing Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Sharing Settings</CardTitle>
                <CardDescription>
                  Control who can access your agent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Make agent public</Label>
                    <p className="text-sm text-gray-500">
                      Allow others to discover and chat with your agent
                    </p>
                  </div>
                  <Switch
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={isSaving || isDeleting}
                  />
                </div>

                {agent.isPublic && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <Label className="text-sm font-medium">Public Share URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <code className="text-sm bg-white px-2 py-1 rounded border flex-1 truncate">
                        {`${window.location.origin}/agents/public/${agent.shareUrl}`}
                      </code>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/agents/public/${agent.shareUrl}`)
                          alert('Share URL copied to clipboard!')
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving || isDeleting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}