'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, MessageSquare, Share, Zap, Users, Shield } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <Bot className="h-16 w-16 text-blue-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">Yellow.Agent</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Build, customize, and deploy AI agents with ease. Create intelligent conversational agents 
            tailored to your specific needs and share them with the world.
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Bot className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Custom AI Agents</CardTitle>
              <CardDescription>
                Create personalized AI agents with custom prompts and personalities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Custom prompts and instructions</li>
                <li>• Multiple AI model options</li>
                <li>• Personality customization</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Real-time Chat</CardTitle>
              <CardDescription>
                Chat with your agents instantly and maintain conversation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Instant messaging interface</li>
                <li>• Conversation history</li>
                <li>• Multiple chat sessions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Share className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Easy Sharing</CardTitle>
              <CardDescription>
                Share your agents with others through public links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Public sharing links</li>
                <li>• Privacy controls</li>
                <li>• Embed options</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-600 mb-2" />
              <CardTitle>Fast & Reliable</CardTitle>
              <CardDescription>
                Built for speed and reliability with modern infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Lightning-fast responses</li>
                <li>• 99.9% uptime</li>
                <li>• Global CDN</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-indigo-600 mb-2" />
              <CardTitle>Multi-Agent Management</CardTitle>
              <CardDescription>
                Create and manage multiple agents for different purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Unlimited agents</li>
                <li>• Organization tools</li>
                <li>• Usage analytics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-red-600 mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• End-to-end encryption</li>
                <li>• GDPR compliant</li>
                <li>• Data sovereignty</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Build Your First Agent?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of developers and businesses using Yellow.Agent to create intelligent AI agents.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="px-12 py-4 text-lg">
              Start Building Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}