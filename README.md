# LaunchHub AI

LaunchHub AI is a production-oriented, AI-enabled startup operating system and digital asset exchange platform. It provides a marketplace for domains, websites, apps, AI assets (datasets, ML models, agents, workflows, prompt libraries), startups, services, and talent — all powered by AI-first intelligence.

## Platform Features

- **Marketplace**: Buy, sell, and lease domains, SaaS products, mobile apps, and AI assets (datasets, ML models, agents, workflows, prompt libraries)
- **AI Navigator**: Gemini-powered intelligent search across all marketplace assets with startup readiness scoring
- **Startup Blueprint Engine**: AI-generated business plans, financial projections, and go-to-market strategies
- **Investor Hub**: Connect with investors, express interest, and match funding stages
- **Startup Hub & Idea Board**: Publish startup ideas, receive community engagement (likes, saves, follows), and accept co-founder applications
- **Co-Founder Matching**: Register profiles with skills, experience, and availability to find co-founders
- **Startup Workspaces**: Full project management with tasks, milestones, team management, document sharing, AI asset integration, and health/readiness scoring
- **Talent Exchange**: Hire vetted engineers, designers, and freelancers with trust scores and ratings
- **Messaging**: Real-time conversations between buyers, sellers, and collaborators
- **Verification System**: Multi-tier trust and identity verification with admin review
- **Dashboard**: Unified command center with active sessions tracking and workspace overview
- **Guru AI Voice Assistant**: Global voice-enabled AI assistant powered by Web Speech API and ElevenLabs TTS, integrated with the Navigator search engine

## Architecture

### Monorepo Structure

```
Venturehub/
├── apps/
│   ├── web/          # Next.js 15 frontend (App Router)
│   └── api/          # FastAPI (Python) backend
├── packages/
│   └── shared/       # Shared TypeScript types and utilities
├── docs/             # Architecture docs, API routes, Postman collections, wireframes
├── k8s/              # Kubernetes deployment manifests
├── prisma/           # Database schema (legacy)
├── docker-compose.yml
├── turbo.json
└── package.json      # npm workspaces root
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | FastAPI (Python), Pydantic v2 with strict field validators, Uvicorn |
| **Database** | Amazon DynamoDB (with local JSON mock fallback for zero-friction dev) |
| **Auth** | AWS Cognito (with local JWT mock fallback) |
| **AI** | Google Gemini API (with keyword-parsing rule engine fallback) |
| **Voice** | Web Speech API (STT) + ElevenLabs API (TTS) with browser SpeechSynthesis fallback |
| **Typography** | Google Fonts (Outfit) |
| **Package Management** | npm workspaces, fnm (Fast Node Manager) |
| **CI/CD** | GitHub Actions |
| **Deployment** | Docker, Kubernetes (full manifests included) |

### Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, feature highlights, and CTA |
| `/login` | User login with validation |
| `/register` | Registration with per-field inline errors and password strength meter |
| `/forgot-password` | Password recovery flow |
| `/dashboard` | Unified command center with analytics and activity |
| `/dashboard/sessions` | Active session management |
| `/dashboard/workspaces/[id]` | Individual startup workspace with tasks, milestones, AI assets, funding, and team |
| `/marketplace` | Multi-tab marketplace (Domains, Websites, Apps, AI Assets, Startups, Talent, Investors) |
| `/navigator` | AI-powered intelligent asset search engine |
| `/blueprint` | AI business plan and blueprint generator |
| `/messages` | Messaging interface |
| `/verification` | Identity and trust verification portal |

### Backend API Routes

All routes are prefixed with `/api/v1`:

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/auth` | Register, login, profile management |
| Marketplace | `/marketplace` | CRUD for domains, websites, apps, AI assets |
| Talent | `/talent` | Talent listing, registration, hiring |
| Startups | `/startups` | Startup idea board, interactions, applications |
| Co-Founder | `/cofounder` | Co-founder profile matching |
| Workspaces | `/workspaces` | Full workspace CRUD with tasks, comments, documents, AI assets |
| Investors | `/investors` | Investor listing, registration, interest expression |
| Messaging | `/messages` | Conversations and message threads |
| Verification | `/verification` | Submit verification, admin review |
| Navigator | `/navigator` | AI-powered asset search |
| Blueprint | `/blueprint` | AI business plan generation |

## Local Setup

### Prerequisites

- **Node.js** ≥ 20 (recommended via [fnm](https://github.com/Schniz/fnm))
- **Python** ≥ 3.11 with `pip`
- **AWS credentials** (optional — the app runs with local mock mode by default)

### Quick Start

1. **Clone and install frontend dependencies:**
   ```bash
   git clone <repo-url>
   cd Venturehub
   npm install
   ```

2. **Set up the backend:**
   ```bash
   cd apps/api
   python -m venv .venv

   # Windows
   .venv\Scripts\activate
   # macOS/Linux
   source .venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example apps/api/.env
   ```
   Edit `apps/api/.env` and fill in secrets. For local development with mocks, set:
   ```
   MOCK_AUTH=True
   ```

4. **Start both servers simultaneously:**
   ```bash
   npm run dev
   ```
   Or start them individually:
   ```bash
   # Frontend only (http://localhost:3000)
   npm run dev:web

   # Backend only (http://localhost:8000)
   npm run dev:api
   ```

5. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### AWS Production Setup (Optional)

To switch from mock mode to real AWS services:

```bash
cd apps/api
python setup_aws.py
```

This script automatically:
- Creates the DynamoDB table (`LaunchHubTable`) with GSI1 index
- Creates a Cognito User Pool and App Client
- Updates `apps/api/.env` with the generated resource IDs
- Sets `MOCK_AUTH=False`

### Docker

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, Elasticsearch, and MinIO containers for extended infrastructure needs.

## Validation & Security

All authentication forms enforce **strict validation** on both frontend and backend with matching rules:

| Field | Rules |
|-------|-------|
| Email | RFC-compliant (`EmailStr`) |
| Username | 3–30 chars, `[a-zA-Z0-9_]`, cannot start with `_` |
| Full Name | 2–100 chars, letters/spaces/hyphens/apostrophes |
| Password | 8–128 chars, uppercase + lowercase + digit + special char required |
| Role | Whitelisted: `founder`, `investor`, `seller`, `agency`, `freelancer` |

Frontend includes per-field inline errors on blur, animated password strength meter, and dynamic border validation states.

## Database Design

The backend uses a **single-table DynamoDB design** with composite keys:

| Entity | PK Pattern | SK | GSI1PK | GSI1SK |
|--------|------------|-----|--------|--------|
| User | `USER#{id}` | `METADATA` | — | — |
| Domain | `ASSET#DOMAIN#{id}` | `METADATA` | `ASSETS#DOMAIN` | `PRICE#{price}` |
| Website | `ASSET#WEBSITE#{id}` | `METADATA` | `ASSETS#WEBSITE` | `REVENUE#{mrr}` |
| App | `ASSET#APP#{id}` | `METADATA` | `ASSETS#APP` | `DOWNLOADS#{count}` |
| AI Asset | `ASSET#AI#{id}` | `METADATA` | `ASSETS#AI#{subCategory}` | `PRICE#{price}` |
| Talent | `TALENT#{id}` | `METADATA` | `TALENT#ROLE#{role}` | `RATE#{rate}` |
| Investor | `INVESTOR#{id}` | `METADATA` | `INVESTORS` | `NAME#{name}` |
| Startup | `STARTUP#{id}` | `METADATA` | `STARTUPS#STAGE#{stage}` | `CREATED#{ts}` |
| Co-Founder | `COFOUNDER#{userId}` | `METADATA` | `COFOUNDERS` | `USER#{userId}` |
| Workspace | `WORKSPACE#{id}` | `METADATA` | `WORKSPACES` | `USER#{founderId}` |
| Message | `CONV#{id}` | `MSG#{msgId}` | — | — |

Local development uses a JSON file mock (`launchhub_dynamodb_mock.json`) that mirrors the DynamoDB API.

## Demo Data

The backend auto-seeds the database on first startup with:
- **5 premium domains** (fintechflow.ai, mediscan.ai, edulearn.ai, cropvision.ai, shopexpress.ai)
- **3 SaaS products** with verified revenue and MRR
- **3 mobile apps** across iOS, Android, and Web
- **9 AI assets**: 3 datasets, 2 ML models, 2 AI agents, 1 workflow, 1 prompt library
- **3 talent profiles** (AI Engineer, Developer, Designer)
- **3 investor profiles** with industry focus and ticket sizes
- **2 startup workspaces** with full task boards, milestones, team, and AI asset portfolios

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend concurrently |
| `npm run dev:web` | Start Next.js frontend only |
| `npm run dev:api` | Start FastAPI backend only |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |

## Documentation

Additional documentation is available in the `docs/` directory:

- [API Routes](docs/api-routes.md) — Endpoint reference
- [Architecture](docs/architecture.md) — System design overview
- [Component Hierarchy](docs/component-hierarchy.md) — Frontend component tree
- [Deployment](docs/deployment.md) — Production deployment guide
- [CI Secrets](docs/ci-secrets.md) — Required CI/CD secrets
- [Wireframes](docs/wireframes.md) — UI wireframes and design specs
- `docs/postman/` — Postman collection for API testing
- `docs/tests/` — Test documentation

## Module Roadmap

1. Authentication and identity foundation ✅
2. Dashboard, notifications, and analytics ✅
3. Marketplaces for domains, websites, apps, AI assets, and startups ✅
4. Investor hub, AI navigator, blueprint engine, and collaboration ✅
5. Strict form validation with per-field inline errors ✅
6. Startup workspaces with task boards, AI asset integration, and health scoring ✅
7. Guru AI voice assistant with ElevenLabs TTS ✅
8. Co-founder matching and startup applications ✅
9. Admin, moderation, billing, and operational controls

## License

Proprietary — All rights reserved.
