# Yellow.Agent - AI Chatbot Platform 🤖


## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chatbot-platform.git
cd chatbot-platform
```

### 2. Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install backend dependencies
cd chatbot-server
npm install

# Install frontend dependencies
cd ../chatbot-client
npm install
```

### 3. Environment Setup

Create environment files for the backend:

```bash
# In chatbot-server directory
touch .env
```

Add the following environment variables to `chatbot-server/.env`:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secrets (generate strong secrets for production)
JWT_ACCESS_SECRET="your-super-secret-access-key-here"
JWT_ACCESS_EXP="15m"
REFRESH_TOKEN_EXP_DAYS="30"

# CORS
CORS_ORIGIN="http://localhost:3000"

# OpenAI API Key (required for AI functionality)
OPENAI_API_KEY="your-openai-api-key-here"
```

### 4. Database Setup

Initialize and migrate the database:

```bash
# In chatbot-server directory
npx prisma generate
npx prisma migrate dev --name migration_name
```

### 5. Start the Application

#### Development Mode

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd chatbot-server
npm run dev
```
The backend will start on `http://localhost:4000`

**Terminal 2 - Frontend Client:**
```bash
cd chatbot-client
npm run dev
```
The frontend will start on `http://localhost:3000`


### 6. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000

## 🛠️ Development


### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

**Happy Chatting! 🤖💬**
