'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
import { Bot, Save, ArrowLeft, Loader2, Lightbulb } from 'lucide-react'

const AI_MODELS = [
  { value: 'gpt-5', label: 'GPT-5', description: 'Latest and most advanced OpenAI model' },
  { value: 'gpt-4o', label: 'GPT-4o', description: 'Multimodal model with vision capabilities' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini', description: 'Faster and more cost-effective version of GPT-4o' }
]

const PROMPT_TEMPLATES = [
  {
    name: 'Customer Support Assistant',
    prompt: 'You are a helpful and friendly customer support assistant. You should:\n- Always be polite and professional\n- Try to understand the customer\'s issue clearly\n- Provide clear, step-by-step solutions\n- Escalate complex issues when needed\n- End conversations on a positive note'
  },
  {
    name: 'Creative Writing Assistant',
    prompt: 'You are a creative writing assistant specializing in storytelling and creative content. You should:\n- Help brainstorm ideas and plot points\n- Suggest character development improvements\n- Provide feedback on writing style and tone\n- Offer creative alternatives and variations\n- Encourage and inspire creativity'
  },
  {
    name: 'Technical Expert',
    prompt: 'You are a technical expert with deep knowledge in programming and software development. You should:\n- Provide accurate technical information\n- Explain complex concepts in simple terms\n- Offer code examples and best practices\n- Help debug and troubleshoot issues\n- Stay updated with latest technologies'
  },
  {
    name: 'Educational Tutor',
    prompt: 'You are an educational tutor who helps students learn effectively. You should:\n- Break down complex topics into simple steps\n- Use examples and analogies to explain concepts\n- Encourage questions and curiosity\n- Provide practice exercises when appropriate\n- Adapt your teaching style to the student\'s level'
  }
]

export default function NewAgentPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { createAgent } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !description.trim() || !model || !prompt.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await createAgent({
        name: name.trim(),
        description: description.trim(),
        model,
        prompt: prompt.trim(),
        isPublic
      })
      
      router.push('/agents')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: any) => {
    setPrompt(template.prompt)
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
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
              <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
              <p className="text-gray-600 mt-1">
                Build your custom AI agent with unique personality and capabilities
              </p>
            </div>
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
                  Give your agent a name and description
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
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your agent does and how it can help users"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">AI Model *</Label>
                  <Select value={model} onValueChange={setModel} disabled={isLoading}>
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
                {/* Template Suggestions */}
                <div className="space-y-2">
                  <Label>Quick Start Templates</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PROMPT_TEMPLATES.map((template) => (
                      <Button
                        key={template.name}
                        type="button"
                        variant="outline"
                        className="h-auto p-3 text-left justify-start min-h-[80px]"
                        onClick={() => handleTemplateSelect(template)}
                        disabled={isLoading}
                      >
                        <div className="w-full">
                          <div className="font-medium text-sm mb-1">{template.name}</div>
                          <div className="text-xs text-gray-500 leading-relaxed break-words overflow-hidden">
                            <div className="line-clamp-3">
                              {template.prompt.substring(0, 120)}...
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="prompt">System Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="You are a helpful assistant that..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Agent
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