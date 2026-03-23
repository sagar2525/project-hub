# 15-Day Intern Learning Plan — Sagar Singh Kushwaha

**Goal:** Build a full-stack Project Management app with an AI Chat Agent (RAG) from scratch
**Stack:** Next.js (frontend) + NestJS (backend) + LangChain + OpenAI + PostgreSQL (pgvector)
**Pace:** 4–5 hours/day | Daily review with mentor
**Repo:** Single monorepo — `project-hub` with `apps/web` (Next.js) and `apps/api` (NestJS)

---

## The Project: **ProjectHub** — AI-Powered Project Management

A project management tool where users can create **Projects**, add **Tickets** (tasks/issues), and leave **Comments**. On top of this, a **RAG-powered AI Chat Agent** lets users ask natural language questions about their project data.

**Example chat queries the agent should handle by Day 15:**
- "What are the open high-priority tickets in Project Alpha?"
- "Summarize the recent activity on the authentication ticket"
- "Which tickets had the most discussion this week?"
- "What did Sagar comment about the payment integration?"

**Final Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│  Next.js Frontend (apps/web)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐ │
│  │ Projects │ │ Tickets  │ │ AI Chat Panel            │ │
│  │ List/CRUD│ │ Board    │ │ (streaming RAG responses)│ │
│  └──────────┘ └──────────┘ └──────────────────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API + SSE
┌──────────────────▼──────────────────────────────────────┐
│  NestJS Backend (apps/api)                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Projects │ │ Tickets  │ │ Comments │ │ Chat (RAG) │ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module     │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│  PostgreSQL + pgvector                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ projects │ │ tickets  │ │ comments │ │ embeddings │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Skill Gap Assessment

| Area | Current Level | Target |
|------|--------------|--------|
| TypeScript | Beginner (knows JS basics) | Working proficiency |
| React / Next.js | None | Can build pages, routing, API calls, state management |
| NestJS | None | Can build REST APIs, services, modules, DB integration |
| PostgreSQL | None (knows MongoDB) | Queries, schemas, pgvector for embeddings |
| LangChain | None (has used LLM APIs directly) | Chains, retrievers, RAG pipeline |
| OpenAI API | Has used similar APIs | Embeddings + Chat completions via LangChain |
| Docker | Basic exposure | Can containerize the full app |

---

## Phase 1: Backend Foundation — NestJS + PostgreSQL (Day 1–5)

---

### Day 1 — Environment Setup + TypeScript + NestJS Scaffold
**Focus:** Set up the monorepo, learn TypeScript basics, scaffold the NestJS backend

**Setup Tasks (1.5 hrs):**
- [ ] Install Node.js (v20 LTS), pnpm, PostgreSQL, VS Code extensions (ESLint, Prettier, Prisma)
- [ ] Install and verify: `psql`, `pgvector` extension
- [ ] Create GitHub repo: `project-hub`
- [ ] Set up monorepo structure:
  ```
  project-hub/
  ├── apps/
  │   ├── api/    ← NestJS (Day 1)
  │   └── web/    ← Next.js (Day 6)
  └── README.md
  ```
- [ ] Scaffold NestJS app: `nest new api` inside `apps/`

**TypeScript Crash Course (2 hrs):**
- [ ] Read: [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [ ] Learn and practice (create a `playground/` folder for scratch files):
  - Types, interfaces, enums, generics
  - Union types, type narrowing
  - `async/await` with proper typing
  - Classes & decorators (critical for NestJS)
- [ ] Resource: [TypeScript Handbook — The Basics through Classes](https://www.typescriptlang.org/docs/handbook/)

**NestJS Intro (1 hr):**
- [ ] Read: [NestJS First Steps](https://docs.nestjs.com/first-steps) + [Controllers](https://docs.nestjs.com/controllers)
- [ ] Understand: Modules, Controllers, Services, Dependency Injection, Decorators
- [ ] Create a dummy `GET /health` endpoint to verify the app runs

**Deliverable:** Monorepo on GitHub. NestJS app running on `localhost:3001` with `/health` returning `{ status: "ok" }`.

---

### Day 2 — Projects Module (NestJS CRUD)
**Focus:** Build the Projects REST API — learn NestJS modules, controllers, services, DTOs

**Learn (1.5 hrs):**
- [ ] Read: [NestJS Providers](https://docs.nestjs.com/providers), [Modules](https://docs.nestjs.com/modules)
- [ ] Key concepts:
  - `nest generate module/controller/service`
  - DTOs (Data Transfer Objects) + `class-validator` for input validation
  - Dependency Injection — how services are injected into controllers
  - Decorators: `@Body()`, `@Param()`, `@Query()`, `@HttpCode()`

**Build (3 hrs):**
- [ ] Generate `ProjectsModule` with controller + service
- [ ] Define DTOs:
  - `CreateProjectDto` — name (required), description (optional), status (enum: ACTIVE/ARCHIVED)
  - `UpdateProjectDto` — partial of CreateProjectDto
- [ ] Implement endpoints (in-memory array for now):
  - `POST /projects` — create a project
  - `GET /projects` — list all projects (with optional `?status=ACTIVE` filter)
  - `GET /projects/:id` — get single project
  - `PATCH /projects/:id` — update project
  - `DELETE /projects/:id` — soft delete (set status to ARCHIVED)
- [ ] Add validation: name must be 3–100 chars, status must be valid enum
- [ ] Test all endpoints with Postman or Thunder Client

**Deliverable:** Projects CRUD API working with in-memory storage. All endpoints tested.

---

### Day 3 — PostgreSQL + Prisma Integration
**Focus:** Replace in-memory storage with real PostgreSQL using Prisma ORM

**Learn (1.5 hrs):**
- [ ] PostgreSQL basics: CREATE TABLE, INSERT, SELECT, JOIN, WHERE, indexes
- [ ] [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart-sqlite) (follow along with PostgreSQL)
- [ ] [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)
- [ ] Key Prisma concepts:
  - `schema.prisma` — models, relations, enums
  - `prisma migrate dev`, `prisma generate`
  - CRUD: `create`, `findMany`, `findUnique`, `update`, `delete`

**Build (3 hrs):**
- [ ] Create database: `projecthub_dev` in PostgreSQL
- [ ] Enable pgvector extension: `CREATE EXTENSION vector;` (needed later but set up now)
- [ ] Define Prisma schema:
  ```prisma
  model Project {
    id          String   @id @default(uuid())
    name        String
    description String?
    status      ProjectStatus @default(ACTIVE)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
    tickets     Ticket[]
  }

  enum ProjectStatus {
    ACTIVE
    ARCHIVED
  }
  ```
- [ ] Create `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`)
- [ ] Create `PrismaModule` (global module)
- [ ] Refactor `ProjectsService` — replace in-memory array with Prisma queries
- [ ] Run migration: `prisma migrate dev --name init`
- [ ] Verify all endpoints still work, now with persistent data

**Deliverable:** Projects API backed by real PostgreSQL. Data persists across server restarts.

---

### Day 4 — Tickets Module (Relations + Filtering)
**Focus:** Build Tickets CRUD with project relations, learn Prisma relations and query building

**Learn (1 hr):**
- [ ] Prisma relations: one-to-many, connecting records
- [ ] Prisma filtering: `where`, `orderBy`, `include`, `select`
- [ ] NestJS: nested routes, query parameters for filtering

**Build (3.5 hrs):**
- [ ] Add `Ticket` model to Prisma schema:
  ```prisma
  model Ticket {
    id          String       @id @default(uuid())
    title       String
    description String?
    status      TicketStatus @default(TODO)
    priority    Priority     @default(MEDIUM)
    projectId   String
    project     Project      @relation(fields: [projectId], references: [id])
    comments    Comment[]
    createdAt   DateTime     @default(now())
    updatedAt   DateTime     @updatedAt
  }

  enum TicketStatus { TODO, IN_PROGRESS, IN_REVIEW, DONE }
  enum Priority { LOW, MEDIUM, HIGH, URGENT }
  ```
- [ ] Run migration: `prisma migrate dev --name add-tickets`
- [ ] Generate `TicketsModule` with controller + service
- [ ] Implement endpoints:
  - `POST /projects/:projectId/tickets` — create ticket under a project
  - `GET /projects/:projectId/tickets` — list tickets (with filters: `?status=TODO&priority=HIGH`)
  - `GET /tickets/:id` — get single ticket (include project name)
  - `PATCH /tickets/:id` — update ticket (status, priority, title, description)
  - `DELETE /tickets/:id` — delete ticket
  - `GET /tickets` — list all tickets across projects (with filters + sorting)
- [ ] DTOs with full validation
- [ ] Handle edge cases: ticket with invalid projectId → 404

**Deliverable:** Tickets API fully working. Can create projects, add tickets, filter by status/priority.

---

### Day 5 — Comments Module + Seed Data
**Focus:** Build Comments CRUD, create a seed script to populate realistic test data

**Learn (0.5 hrs):**
- [ ] Prisma: nested writes, cascading operations
- [ ] Seeding data with Prisma: `prisma/seed.ts`

**Build (4 hrs):**
- [ ] Add `Comment` model to Prisma schema:
  ```prisma
  model Comment {
    id        String   @id @default(uuid())
    content   String
    author    String
    ticketId  String
    ticket    Ticket   @relation(fields: [ticketId], references: [id])
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] Run migration: `prisma migrate dev --name add-comments`
- [ ] Generate `CommentsModule` with controller + service
- [ ] Implement endpoints:
  - `POST /tickets/:ticketId/comments` — add comment to ticket
  - `GET /tickets/:ticketId/comments` — list comments for a ticket
  - `PATCH /comments/:id` — edit a comment
  - `DELETE /comments/:id` — delete a comment
- [ ] **Create a comprehensive seed script** (`prisma/seed.ts`):
  - 3 projects (e.g., "E-Commerce Platform", "Mobile App Redesign", "API Gateway Migration")
  - 8–10 tickets per project with realistic titles and descriptions
  - 3–5 comments per ticket with realistic discussion content
  - Mix of statuses and priorities
  - **This seed data is critical** — the RAG agent will search through this data later
- [ ] Run seed: `npx prisma db seed`
- [ ] Test the full API flow: create project → add tickets → add comments → query/filter

**Deliverable:** Complete backend API (Projects + Tickets + Comments). Rich seed data loaded. All endpoints documented in Postman collection.

---

## Phase 2: Frontend with Next.js (Day 6–9)

---

### Day 6 — React + Next.js Crash Course + Project Scaffold
**Focus:** Learn React fundamentals and Next.js App Router, scaffold the frontend

**Learn (2.5 hrs):**
- [ ] [React Quick Start](https://react.dev/learn) — read through "Thinking in React"
  - JSX, components, props, `useState`, `useEffect`
  - Conditional rendering, lists & keys, forms
- [ ] [Next.js Learn Course — Chapters 1–5](https://nextjs.org/learn)
  - App Router (`app/` directory), `page.tsx`, `layout.tsx`
  - Server Components vs Client Components (`"use client"`)
  - Dynamic routes (`[id]/page.tsx`)
  - `next/link`, `next/image`

**Build (2 hrs):**
- [ ] Create Next.js app in `apps/web/`: `npx create-next-app@latest web --typescript --tailwind --app`
- [ ] Set up project structure:
  ```
  apps/web/
  ├── app/
  │   ├── layout.tsx          ← root layout with sidebar
  │   ├── page.tsx            ← dashboard / projects list
  │   ├── projects/
  │   │   └── [projectId]/
  │   │       └── page.tsx    ← project detail + tickets
  │   └── chat/
  │       └── page.tsx        ← AI chat (later)
  ├── components/
  │   ├── Sidebar.tsx
  │   ├── ProjectCard.tsx
  │   └── ...
  └── lib/
      └── api.ts              ← API client helpers
  ```
- [ ] Build the root layout with a sidebar navigation (Projects, Chat links)
- [ ] Create `lib/api.ts` — helper functions to call the NestJS backend
- [ ] Enable CORS on NestJS backend
- [ ] Build the **Dashboard page** (`/`):
  - Fetch all projects from backend (server component)
  - Display as cards showing: project name, ticket count, status
  - "New Project" button (non-functional yet)

**Deliverable:** Next.js app running on `localhost:3000`. Dashboard shows projects from backend.

---

### Day 7 — Projects UI (CRUD + Navigation)
**Focus:** Full project management UI — create, view, edit, archive projects

**Learn (1 hr):**
- [ ] Next.js: Server Actions vs client-side fetch for mutations
- [ ] React: controlled forms, form submission, optimistic updates
- [ ] Tailwind CSS: layout utilities, responsive design basics

**Build (3.5 hrs):**
- [ ] **Create Project form** (`"use client"` component):
  - Modal or separate page with name + description fields
  - Client-side validation (name required, min 3 chars)
  - Submit → POST to backend → redirect to project page
- [ ] **Project Detail page** (`/projects/[projectId]`):
  - Show project name, description, status
  - Edit button → inline edit or modal
  - Archive button (PATCH status to ARCHIVED)
  - Tickets section (empty list for now, built on Day 8)
- [ ] **Dashboard enhancements:**
  - Search/filter projects by name
  - Show ACTIVE vs ARCHIVED toggle
  - Click project card → navigate to detail page
- [ ] Handle loading states (`loading.tsx`) and errors

**Deliverable:** Full project CRUD from the UI. Can create, view, edit, and archive projects.

---

### Day 8 — Tickets UI (Board View + CRUD)
**Focus:** Build a ticket board/list with full CRUD inside the project detail page

**Learn (1 hr):**
- [ ] React: lifting state up, component composition
- [ ] Handling enums in forms (select dropdowns for status/priority)

**Build (3.5 hrs):**
- [ ] **Ticket List/Board** on project detail page:
  - Display tickets grouped by status (TODO | IN_PROGRESS | IN_REVIEW | DONE)
  - Each ticket card shows: title, priority badge (color-coded), comment count
  - Filter bar: by status, by priority
  - Sort by: created date, priority, updated date
- [ ] **Create Ticket form:**
  - Title, description (textarea), priority (dropdown), status (dropdown)
  - Submit → POST to backend → ticket appears in list
- [ ] **Ticket Detail view** (slide-over panel or new page):
  - Full ticket info: title, description, status, priority, created date
  - Edit inline — change status/priority with dropdowns
  - Delete button with confirmation
  - Comments section (empty for now, built on Day 9)
- [ ] **Quick status update:**
  - Dropdown or buttons on ticket card to change status without opening detail view

**Deliverable:** Can manage tickets within projects. Board view with filtering and status updates.

---

### Day 9 — Comments UI + Full Integration Testing
**Focus:** Build comments, test the full CRUD flow end-to-end

**Build (3 hrs):**
- [ ] **Comments Section** (on ticket detail view):
  - List all comments for the ticket (newest first)
  - Each comment shows: author, content, timestamp
  - "Add comment" form at the bottom (author name input + content textarea)
  - Edit comment (inline edit on click)
  - Delete comment (with confirmation)
- [ ] **Activity indicator on ticket cards:**
  - Show comment count badge on ticket cards
  - Show "last updated" timestamp

**Full Integration Testing (1.5 hrs):**
- [ ] Reset database and run seed script
- [ ] Test the complete flow through the UI:
  1. View dashboard with seeded projects
  2. Create a new project
  3. Add tickets with different priorities/statuses
  4. Move tickets between statuses
  5. Add comments to tickets
  6. Verify filtering and sorting work
  7. Edit and delete operations
- [ ] Fix any bugs found during testing
- [ ] Take screenshots for documentation

**Deliverable:** Complete working Project Management app (no AI yet). Full CRUD for Projects → Tickets → Comments.

---

## Phase 3: RAG Chat Agent (Day 10–13)

---

### Day 10 — OpenAI + LangChain Basics + Embeddings Intro
**Focus:** Learn LangChain.js fundamentals, understand embeddings, set up pgvector

**Learn (2.5 hrs):**
- [ ] [OpenAI API Quickstart](https://platform.openai.com/docs/quickstart) — Chat Completions & Embeddings API
- [ ] [LangChain.js Introduction](https://js.langchain.com/docs/introduction/)
- [ ] Key concepts:
  - Chat models (`ChatOpenAI`)
  - Prompt templates — system + human messages with variables
  - Output parsers — structured JSON output
  - Chains (LCEL — LangChain Expression Language): prompt | model | parser
  - **Embeddings** — how text becomes vectors, why this enables semantic search
  - `text-embedding-3-small` model (1536 dimensions, cheap, fast)
- [ ] Understand RAG at a high level:
  ```
  User Question → Embed Question → Find Similar Content in DB → Feed to LLM → Answer
  ```

**Build (2 hrs):**
- [ ] Install: `@langchain/openai`, `@langchain/core`, `langchain` in `apps/api/`
- [ ] Create a standalone script `apps/api/scripts/test-embeddings.ts`:
  - Generate embeddings for 5 sample ticket titles using OpenAI
  - Print the vector (show it's just an array of numbers)
  - Calculate cosine similarity between pairs to demonstrate semantic closeness
  - Example: "Fix login bug" should be closer to "Authentication error on signin" than to "Update payment UI"
- [ ] Set up pgvector in the database:
  - Add an `Embedding` model to Prisma schema:
    ```prisma
    model Embedding {
      id         String   @id @default(uuid())
      content    String   // the text that was embedded
      embedding  Unsupported("vector(1536)")
      sourceType String   // "ticket", "comment", "project"
      sourceId   String   // ID of the ticket/comment/project
      metadata   Json?    // extra info (projectName, ticketTitle, etc.)
      createdAt  DateTime @default(now())
    }
    ```
  - Run migration
  - Write a raw SQL query to insert an embedding and do similarity search

**Deliverable:** Understands embeddings conceptually. Can generate and store vectors in pgvector. Similarity search working via raw SQL.

---

### Day 11 — Embedding Pipeline (Sync Project Data → Vectors)
**Focus:** Build the service that converts all project data into searchable embeddings

**Learn (1 hr):**
- [ ] Chunking strategies: why we format data into meaningful text chunks
- [ ] Metadata in RAG: attaching source info so the LLM can cite its answers
- [ ] LangChain vector store: PGVectorStore setup

**Build (3.5 hrs):**
- [ ] Create `EmbeddingModule` in NestJS with `EmbeddingService`:
  - **`generateEmbeddings(text: string): Promise<number[]>`** — calls OpenAI embeddings API
  - **`syncProjectEmbeddings(projectId: string)`** — for a given project:
    1. Gather all data: project info, all tickets, all comments
    2. Format each piece into a rich text chunk, e.g.:
       ```
       Ticket: "Fix payment gateway timeout"
       Project: E-Commerce Platform
       Status: IN_PROGRESS | Priority: HIGH
       Description: The payment gateway times out after 30 seconds...
       ```
       ```
       Comment by Sagar on ticket "Fix payment gateway timeout":
       "I found the issue — the webhook URL was misconfigured. Pushing a fix now."
       ```
    3. Generate embedding for each chunk
    4. Upsert into `Embedding` table with metadata (sourceType, sourceId, projectName, ticketTitle)
  - **`syncAllEmbeddings()`** — sync all projects
  - **`deleteEmbeddingsBySource(sourceType, sourceId)`** — cleanup when data is deleted

- [ ] Create API endpoints:
  - `POST /embeddings/sync` — trigger full sync (run on seed data)
  - `POST /embeddings/sync/:projectId` — sync one project
  - `GET /embeddings/search?q=payment+issue&limit=5` — semantic search endpoint (for testing)

- [ ] **Hook into CRUD operations** (event-driven):
  - When a ticket is created/updated → re-embed that ticket
  - When a comment is added/updated → re-embed that comment
  - When a ticket/project is deleted → remove its embeddings
  - Use NestJS Events (`@nestjs/event-emitter`) for loose coupling

- [ ] Run full sync on seed data. Test semantic search:
  - Query: "payment problems" → should find payment-related tickets/comments
  - Query: "what is the team working on?" → should find IN_PROGRESS tickets

**Deliverable:** All project data embedded in pgvector. Semantic search returns relevant results. Auto-sync on CRUD operations.

---

### Day 12 — RAG Chat Agent (Backend)
**Focus:** Build the chat endpoint that uses retrieval-augmented generation to answer questions about project data

**Learn (1.5 hrs):**
- [ ] RAG chain architecture in LangChain:
  - Retriever → retrieves relevant documents
  - Prompt template → injects retrieved context + user question
  - LLM → generates answer based on context
- [ ] Conversational RAG — using chat history for follow-up questions
- [ ] [LangChain.js RAG Tutorial](https://js.langchain.com/docs/tutorials/rag/)

**Build (3 hrs):**
- [ ] Create `ChatModule` in NestJS with `ChatService`:
- [ ] Add `ChatMessage` model to Prisma:
  ```prisma
  model ChatMessage {
    id        String   @id @default(uuid())
    role      String   // "user" or "assistant"
    content   String
    sources   Json?    // array of {sourceType, sourceId, snippet}
    sessionId String   // group messages by conversation
    createdAt DateTime @default(now())
  }
  ```
- [ ] Implement the RAG pipeline in `ChatService`:
  1. **Receive** user question + sessionId
  2. **Load chat history** for this session (last 10 messages)
  3. **Rephrase question** using chat history (so "what about that ticket?" works as a follow-up)
     - Use LangChain: history + question → standalone question
  4. **Retrieve** top 5 relevant chunks from pgvector using the rephrased question
  5. **Generate answer** using prompt template:
     ```
     You are a helpful project management assistant. Answer questions
     based on the project data provided below. Always cite which
     project/ticket/comment your answer comes from.

     If the information is not in the context, say "I don't have
     information about that in the project data."

     Context:
     {retrieved_chunks}

     Chat History:
     {chat_history}

     Question: {question}
     ```
  6. **Save** both user message and assistant response to DB
  7. **Return** response with source references

- [ ] Implement endpoints:
  - `POST /chat` — `{ message: string, sessionId: string }` → `{ response: string, sources: [] }`
  - `GET /chat/history/:sessionId` — get conversation history
  - `DELETE /chat/history/:sessionId` — clear a conversation

- [ ] Test with curl/Postman:
  - "What are the high priority tickets?" → should list them with project context
  - "Tell me about the payment gateway issue" → should pull ticket + comments
  - Follow-up: "Who commented on it?" → should use chat history to understand "it"

**Deliverable:** Working RAG chat endpoint. Can answer questions about project data with source citations. Conversational follow-ups work.

---

### Day 13 — Chat UI + Streaming Responses
**Focus:** Build the chat interface in Next.js with real-time streaming

**Learn (1 hr):**
- [ ] Server-Sent Events (SSE) — how streaming works over HTTP
- [ ] LangChain streaming: `.stream()` method on chains
- [ ] Consuming SSE in the browser with `EventSource` or `fetch` + `ReadableStream`

**Build (3.5 hrs):**
- [ ] **Add streaming to backend:**
  - New endpoint: `POST /chat/stream` — returns SSE stream
  - LangChain: use `.stream()` on the RAG chain → pipe tokens as SSE events
  - Stream format: `data: {"token": "The"}`, `data: {"token": " high"}`, ... `data: {"done": true, "sources": [...]}`

- [ ] **Build Chat page** (`/chat`):
  - Chat interface with:
    - Message list (scrollable, auto-scroll to bottom)
    - Input bar at the bottom (textarea + send button)
    - Messages styled differently for user vs assistant
  - **Streaming display:**
    - When user sends message → show "thinking" indicator
    - As tokens stream in → append to assistant message in real-time
    - When done → show source citations below the response
  - **Source citations:**
    - Clickable links: "From ticket: Fix payment gateway (E-Commerce Platform)"
    - Clicking a source navigates to that ticket in the app
  - **Conversation management:**
    - "New conversation" button (generates new sessionId)
    - Chat history loads on page refresh
  - **Suggested questions** (shown when chat is empty):
    - "What are the open high-priority tickets?"
    - "Summarize recent activity across all projects"
    - "Which project has the most open tickets?"

- [ ] **Add chat entry point to other pages:**
  - Floating chat button on project/ticket pages
  - Pre-fill chat with context: "Tell me about [current project/ticket]"

**Deliverable:** Full chat UI with streaming responses. Can ask questions about project data and navigate to sources.

---

## Phase 4: Advanced Features + Polish (Day 14–15)

---

### Day 14 — LangGraph Agent + Advanced RAG
**Focus:** Upgrade from simple RAG chain to a LangGraph agent that can take actions

**Learn (1.5 hrs):**
- [ ] [LangGraph.js Introduction](https://langchain-ai.github.io/langgraphjs/)
  - Nodes, edges, state, conditional routing
  - Tool-calling agents: LLM decides which tool to use
- [ ] Agent vs chain: when the LLM needs to make decisions about what to do

**Build (3 hrs):**
- [ ] **Upgrade ChatService to use LangGraph agent:**
  - Define agent tools:
    - `search_projects` — semantic search across project data (existing RAG retriever)
    - `get_project_details` — fetch full project info by name/ID
    - `get_ticket_details` — fetch full ticket with comments
    - `list_tickets` — list tickets with filters (status, priority, project)
    - `get_project_stats` — ticket counts by status/priority for a project
  - Build LangGraph workflow:
    ```
    User Message → Agent Node → (decides tool) → Tool Node → Agent Node → Response
                        ↑                                         |
                        └─────────── (needs more info) ───────────┘
    ```
  - The agent can now:
    - Answer from semantic search (RAG) for broad questions
    - Call specific tools for precise queries ("how many open tickets in Project Alpha?")
    - Chain multiple tool calls ("compare ticket counts between Project Alpha and Beta")
    - Decline gracefully when it can't help

- [ ] **Test advanced queries:**
  - "How many tickets are in each status for the E-Commerce project?" → uses `get_project_stats`
  - "What's the latest update on the payment issue?" → uses `search_projects` + `get_ticket_details`
  - "Create a summary of all in-progress work" → uses `list_tickets` with status filter
  - "Compare progress between the E-Commerce and Mobile App projects" → multiple tool calls

- [ ] **Improve retrieval quality:**
  - Add hybrid search: combine semantic (pgvector) + keyword (PostgreSQL full-text search `tsvector`)
  - Add metadata filtering: limit search to specific project if context is clear
  - Better chunk formatting for more accurate retrieval

**Deliverable:** LangGraph agent with tool-calling. Handles both broad and specific queries intelligently.

---

### Day 15 — Docker, Polish, Documentation + Final Review
**Focus:** Containerize everything, polish UI, document the project

**Docker (1.5 hrs):**
- [ ] Create `Dockerfile` for NestJS backend
- [ ] Create `Dockerfile` for Next.js frontend
- [ ] Create `docker-compose.yml`:
  ```yaml
  services:
    db:
      image: pgvector/pgvector:pg16
      environment:
        POSTGRES_DB: projecthub
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports: ["5432:5432"]
    api:
      build: ./apps/api
      depends_on: [db]
      environment:
        DATABASE_URL: postgresql://postgres:postgres@db:5432/projecthub
        OPENAI_API_KEY: ${OPENAI_API_KEY}
      ports: ["3001:3001"]
    web:
      build: ./apps/web
      depends_on: [api]
      ports: ["3000:3000"]
  ```
- [ ] Verify: `docker-compose up` → everything works from scratch
- [ ] Seed script runs automatically on first boot

**UI Polish (1.5 hrs):**
- [ ] Markdown rendering in chat responses (use `react-markdown`)
- [ ] Loading skeletons for data fetching
- [ ] Error states and empty states
- [ ] Responsive design check (works on tablet)
- [ ] Copy button on chat responses
- [ ] Toast notifications for CRUD operations

**Documentation (0.5 hr):**
- [ ] Write `README.md`:
  - Architecture overview
  - Tech stack
  - Setup instructions (local + Docker)
  - Screenshots
  - API endpoint summary

**Final Review with Mentor (1 hr):**
- [ ] Full demo walkthrough
- [ ] Code review — architecture, patterns, readability
- [ ] Discuss:
  - What went well, what was challenging
  - How this would scale (auth, teams, real-time updates, file attachments)
  - How the RAG approach maps to the real project
  - Next steps: what to learn deeper

**Deliverable:** Complete, Dockerized, documented ProjectHub application. Ready for demo.

---

## Daily Routine Template

| Time Block | Activity |
|-----------|----------|
| First 30 min | Read/watch learning material for the day |
| Next 1–1.5 hrs | Continue learning + take notes |
| Next 2.5–3 hrs | Build the day's feature in the ProjectHub app |
| Last 15 min | Push to GitHub + write a short commit summary |
| EOD | Review session with mentor (demo what you built today) |

---

## Day-by-Day Progress Map

| Day | What Gets Built | Cumulative State |
|-----|----------------|------------------|
| 1 | Monorepo + NestJS scaffold + TypeScript basics | Empty API running |
| 2 | Projects CRUD API (in-memory) | Can create/manage projects via Postman |
| 3 | PostgreSQL + Prisma integration | Projects persist in DB |
| 4 | Tickets CRUD API with relations | Projects + Tickets in DB with filtering |
| 5 | Comments CRUD + seed data | **Full backend complete** with rich test data |
| 6 | Next.js scaffold + Projects dashboard | Can see projects in browser |
| 7 | Projects CRUD UI | Full project management in UI |
| 8 | Tickets board/list UI | Can manage tickets within projects |
| 9 | Comments UI + integration testing | **Full CRUD app working end-to-end** |
| 10 | LangChain basics + pgvector setup | Embeddings working, semantic search via script |
| 11 | Embedding pipeline + auto-sync | All project data searchable via vectors |
| 12 | RAG chat endpoint | Can chat about project data via Postman |
| 13 | Chat UI with streaming | **Full RAG chat working in browser** |
| 14 | LangGraph agent + advanced RAG | Smart agent with tool-calling |
| 15 | Docker + polish + docs | **Production-ready, documented, containerized** |

---

## Resources

| Topic | Resource |
|-------|----------|
| TypeScript | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) |
| React | [React.dev Learn](https://react.dev/learn) |
| Next.js | [Next.js Learn Course](https://nextjs.org/learn) |
| NestJS | [NestJS Official Docs](https://docs.nestjs.com/) |
| Prisma | [Prisma Docs](https://www.prisma.io/docs) |
| pgvector | [pgvector GitHub](https://github.com/pgvector/pgvector) |
| LangChain.js | [LangChain.js Docs](https://js.langchain.com/docs/introduction/) |
| LangGraph.js | [LangGraph.js Docs](https://langchain-ai.github.io/langgraphjs/) |
| OpenAI | [OpenAI API Docs](https://platform.openai.com/docs) |

---

## Success Criteria

By Day 15, Sagar should be able to:

1. **Explain and build** a NestJS backend with modules, services, Prisma, and PostgreSQL
2. **Build a Next.js frontend** with App Router, server/client components, and Tailwind
3. **Design a database schema** with relations and use Prisma ORM fluently
4. **Explain RAG architecture** — embedding, vector search, retrieval, generation
5. **Build an embedding pipeline** that syncs structured data into pgvector
6. **Implement a RAG chat agent** using LangChain.js + OpenAI + pgvector
7. **Build a LangGraph agent** with tool-calling for intelligent query routing
8. **Stream LLM responses** from backend to frontend via SSE
9. **Dockerize** a multi-service application
10. **Be ready** to contribute to the team's RAG-based project from Day 16
