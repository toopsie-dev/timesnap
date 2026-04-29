# TimeSnap

A local-first time tracking app built with Nuxt 3, Vue 3, TailwindCSS v4, and SQLite. Track time across projects, milestones, and tasks with live timers, session history, and budget monitoring.

---

## Features

- **3-level hierarchy** — Projects → Milestones → Sub-features (tasks)
- **Live timers** — real-time elapsed time per task, milestone, and project
- **Start / Pause / Stop** — each task can be independently controlled
- **Idle milestone** — auto-created per project for non-billable activities (meetings, breaks, etc.)
- **Budget tracking** — set estimated hours; timers turn red when over budget
- **Session history** — every start/stop writes a log entry, viewable per project
- **Log filters** — filter history by milestone and task
- **Pagination** — configurable records per page (10 / 25 / 50 / 100)
- **Accordion UI** — one project and one milestone open at a time
- **Running first** — active projects and tasks float to the top automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (`ssr: false`) |
| UI | [Vue 3](https://vuejs.org) + [TailwindCSS v4](https://tailwindcss.com) |
| State | [Pinia](https://pinia.vuejs.org) |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (local SQLite) |
| Icons | [lucide-vue-next](https://lucide.dev) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3002)
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
TimeSnap/
├── app/
│   ├── assets/css/        # TailwindCSS v4 theme
│   ├── components/        # Vue components
│   │   ├── ProjectRow.vue
│   │   ├── MilestoneRow.vue
│   │   ├── SubFeatureRow.vue
│   │   ├── SubFeatureTimer.vue
│   │   ├── AppModal.vue
│   │   ├── ConfirmDialog.vue
│   │   └── CreateProjectForm.vue
│   ├── pages/
│   │   ├── index.vue                    # Main dashboard
│   │   └── projects/[id]/logs.vue       # Session history
│   └── stores/
│       └── projects.ts                  # Pinia store
├── server/
│   ├── api/                             # REST endpoints
│   │   ├── projects/
│   │   ├── milestones/
│   │   └── subfeatures/
│   └── utils/
│       └── db.ts                        # SQLite singleton + schema
├── data/
│   └── timesnap.db                      # SQLite database (auto-created)
└── nuxt.config.ts
```

---

## Database Schema

```sql
projects       (id, name, description, estimated_hours, created_at, updated_at)
milestones     (id, project_id, name, description, estimated_hours, created_at, updated_at)
sub_features   (id, milestone_id, name, description, estimated_hours, status, total_ms, started_at, notes, created_at, updated_at)
time_logs      (id, sub_feature_id, started_at, stopped_at, duration_ms)
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| PATCH | `/api/projects/:id` | Update project name/description |
| DELETE | `/api/projects/:id` | Delete project |
| PATCH | `/api/milestones/:id` | Update milestone name |
| GET | `/api/milestones/:id/subfeatures` | List sub-features |
| POST | `/api/milestones/:id/subfeatures` | Create sub-feature |
| PATCH | `/api/subfeatures/:id` | Update sub-feature name/estimated hours |
| DELETE | `/api/subfeatures/:id` | Delete sub-feature |
| POST | `/api/subfeatures/:id/start` | Start timer |
| POST | `/api/subfeatures/:id/pause` | Pause timer + log session |
| POST | `/api/subfeatures/:id/stop` | Stop timer + log session |
| PATCH | `/api/subfeatures/:id/notes` | Update notes |
| GET | `/api/projects/:id/logs` | Get session history |

---

## Usage

### Creating a Project

1. Click **New Project** in the top-right header
2. Enter a project name, optional description, and estimated hours
3. Add milestones and their sub-features (tasks)
4. Submit — an **Idle** milestone is auto-created for non-billable time

### Tracking Time

- Click a project row to expand it
- Click a milestone to see its tasks
- Hit **▶** on a task to start the timer
- Hit **⏸** to pause (logs the session), **⏹** to stop and reset
- The running task floats to the top of its milestone

### Session History

- Click the **clock/history** icon on a project row to open its full session log
- Filter by milestone or task using the dropdowns
- Use the page size selector and pagination to navigate large logs

---

## License

MIT

npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
