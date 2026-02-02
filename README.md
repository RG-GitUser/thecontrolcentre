# The Control Centre

A simple, intuitive project tracker with a **spaceship / control center** theme. Track multiple project boards and manage tasks with a mission-control style dashboard.

## Features

- **Dashboard** — View all project boards, create new ones, edit or delete boards
- **Project progress boards** — Each board has its own task list with three columns: Pending, In progress, Done
- **Task CRUD** — Add, edit, and delete tasks; change status via dropdown or when editing
- **Persistence** — Data is stored in your browser (localStorage) so it survives refreshes
- **Discord updates** — Optional webhook: every change (project/task add, edit, delete) posts to Discord with commit hash (GitHub), day, date, time, user, and status/ticket details

## Discord & GitHub (optional)

1. Go to **Settings** in the app.
2. Enable **Discord updates** and paste your **Discord webhook URL** (Channel → Edit → Integrations → Webhooks).
3. Set **Your name** so updates are attributed.
4. Set **GitHub repo** (`owner/repo` or full URL) so the latest commit hash on the default branch is included in each update.

Each Discord message includes: **Commit**, **Day**, **Date**, **Time**, **User**, and a **Status** description (e.g. “Task X added to Pending”, “Task Y moved to Done”). For build-time commit (e.g. in CI), set `VITE_GIT_COMMIT` when building.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Tech

- React 18 + Vite
- React Router
- CSS with a control-center / sci-fi theme (Orbitron + Share Tech Mono, teal accent, dark panels)
