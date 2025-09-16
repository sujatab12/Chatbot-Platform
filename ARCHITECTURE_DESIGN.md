# Yellow.Agent - Chatbot Platform Architecture & Design Document

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema Details](#database-schema-details)
5. [API Design](#api-design)
6. [Frontend Routing Structure](#frontend-routing-structure)
7. [Security Architecture](#security-architecture)
8. [Development Environment](#development-environment)
9. [Data Flow Diagrams](#data-flow-diagrams)

## Overview

Yellow.Agent is a comprehensive chatbot platform that enables users to create, customize, and deploy AI agents. The platform supports both private and public agent sharing, real-time chat functionality, and session management.

### Key Features
- **Agent Management**: Create, edit, delete, and share AI agents
- **Real-time Chat**: Interactive conversations with AI agents
- **Session Management**: Persistent chat history and context
- **Public Sharing**: Share agents publicly without authentication
- **Multi-model Support**: Support for various AI models (GPT-5, GPT-4o, GPT-4o-mini)
- **Authentication**: JWT-based authentication with refresh tokens

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        Client Layer                            │
├────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (React)                                      │
│  ├── Pages (App Router)                                        │
│  ├── Components (UI Library)                                   │
│  ├── Contexts (State Management)                               │
│  └── API Routes (Proxy Layer)                                  │
└────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/REST API
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                        Server Layer                            │
├────────────────────────────────────────────────────────────────┤
│  Express.js Backend                                            │
│  ├── Authentication Middleware                                 │
│  ├── Route Handlers                                            │
│  ├── Business Logic                                            │
│  └── OpenAI Integration                                        │
└────────────────────────────────────────────────────────────────┘
                                │
                                │ ORM
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                      Data Layer                               │
├───────────────────────────────────────────────────────────────┤
│  SQLite Database (via Prisma ORM)                             │
│  ├── Users                                                    │
│  ├── Projects (Agents)                                        │
│  ├── Chat Sessions                                            │
│  ├── Messages                                                 │
│  └── Refresh Tokens                                           │
└───────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend (Client)
- **Framework**: Next.js 14.2.32 (React 18)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.3.0
- **UI Components**: Custom component library
- **State Management**: React Context API
- **Icons**: Lucide React
- **Build Tool**: Next.js built-in webpack

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.9.2
- **Database**: SQLite with Prisma ORM 6.15.0
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 3.0.2
- **AI Integration**: @openai/agents 0.1.1
- **Validation**: Zod 3.25.76
- **CORS**: cors 2.8.5
- **Logging**: morgan 1.10.1


### Database Schema Details

#### User Table
- **Purpose**: Store user account information
- **Key Fields**: id, email (unique), name, password (hashed)
- **Relationships**: One-to-many with Projects, ChatSessions, RefreshTokens

#### Project Table (Agents)
- **Purpose**: Store AI agent configurations
- **Key Fields**: id, name, instructions, model, isPublic, shareUrl
- **Relationships**: Many-to-one with User, One-to-many with Messages, ChatSessions

#### ChatSession Table
- **Purpose**: Group related messages into conversations
- **Key Fields**: id, title, projectId, userId
- **Relationships**: Many-to-one with Project and User, One-to-many with Messages

#### Message Table
- **Purpose**: Store individual chat messages
- **Key Fields**: id, content, role, projectId, sessionId
- **Relationships**: Many-to-one with Project and ChatSession

#### RefreshToken Table
- **Purpose**: Store refresh tokens for JWT authentication
- **Key Fields**: id, tokenHash, userId, expiresAt, revoked
- **Relationships**: Many-to-one with User

## API Design

### RESTful API Endpoints

#### Authentication Routes (`/auth`)
```
POST   /auth/login          - User login
POST   /auth/signup         - User registration
POST   /auth/refresh        - Refresh access token
POST   /auth/logout         - User logout
```

#### User Routes (`/api`)
```
GET    /api/me              - Get current user info
```

#### Project Routes (`/projects`)
```
GET    /projects            - Get user's projects
POST   /projects            - Create new project
GET    /projects/:id        - Get specific project
PUT    /projects/:id        - Update project
DELETE /projects/:id        - Delete project
POST   /projects/:id/chat   - Send message to project agent
GET    /projects/public/:shareUrl     - Get public project
POST   /projects/public/:shareUrl/chat - Chat with public project
```

#### Session Routes (`/sessions`)
```
GET    /sessions/project/:projectId  - Get chat sessions for project
GET    /sessions/:id                 - Get specific chat session
POST   /sessions                     - Create new chat session
DELETE /sessions/:id                 - Delete chat session
```

### API Response Format
```typescript
// Success Response
{
  "data": any,
  "message"?: string
}

// Error Response
{
  "message": string,
  "error"?: string,
  "statusCode": number
}
```

## Frontend Routing Structure
```
/                           - Home page
/auth/login                 - Login page
/auth/signup                - Signup page
/dashboard                  - User dashboard
/agents                     - Agents list
/agents/new                 - Create agent
/agents/[id]/edit           - Edit agent
/chat                       - Chat interface
/agents/public/[shareUrl]   - Public agent chat
```

## Security Architecture

### Authentication Flow
```
1. User Login
   ├── Validate credentials
   ├── Generate JWT access token (15 min expiry)
   ├── Generate refresh token (30 days expiry)
   └── Store refresh token in HTTP-only cookie

2. API Requests
   ├── Extract JWT from Authorization header
   ├── Validate token signature and expiry
   └── Attach user info to request

3. Token Refresh
   ├── Extract refresh token from cookie
   ├── Validate refresh token
   ├── Generate new access token
   └── Optionally rotate refresh token
```

### Security Measures
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Security**: Signed tokens with secret key
- **Refresh Token Rotation**: Prevents token reuse
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM parameterized queries

## Development Environment
```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Next.js)     │    │   (Express)     │
│   Port: 3000    │◄──►│   Port: 4000    │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   SQLite DB     │
                       │   (File-based)  │
                       └─────────────────┘
```


## Data Flow Diagrams

### User Authentication Flow
```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │    │Frontend │    │Backend  │    │Database │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │ 1. Login     │              │              │
     ├─────────────►│              │              │
     │              │ 2. POST /auth/login         │
     │              ├─────────────►│              │
     │              │              │ 3. Validate credentials
     │              │              ├─────────────►│
     │              │              │ 4. User data │
     │              │              │◄─────────────┤
     │              │ 5. JWT + Refresh Token      │
     │              │◄─────────────┤              │
     │ 6. Success   │              │              │
     │◄─────────────┤              │              │
```

### Chat Message Flow
```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  User   │    │Frontend │    │Backend  │    │OpenAI   │    │Database │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     │ 1. Send msg  │              │              │              │
     ├─────────────►│              │              │              │
     │              │ 2. POST /projects/:id/chat  │              │
     │              ├─────────────►│              │              │
     │              │              │ 3. Save user message        │
     │              │              ├──────────────|─────────────►│              
     │              │              │ 4. Call OpenAI API          │
     │              │              ├─────────────►│              │
     │              │              │ 5. AI response              │
     │              │              │◄─────────────┤              │
     │              │              │ 6. Save AI message          │
     │              │              ├──────────────|─────────────►│              
     │              │ 7. Response  │              │              │
     │              │◄─────────────┤              │              │
     │ 8. Display   │              │              │              │
     │◄─────────────┤              │              │              │
```

