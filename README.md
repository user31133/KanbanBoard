# GitHub Issues Kanban Board

A modern, interactive Kanban board for managing GitHub Issues with a beautiful UI and real-time updates. Built with Next.js 15, TypeScript, and Tailwind CSS.

![GitHub Issues Kanban Board](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## Features

### 🎯 Core Functionality

- **GitHub Integration**: Seamlessly connects to your GitHub repositories using OAuth authentication
- **Kanban Board**: Visual project management with three columns (To Do, In Progress, Done)
- **Drag & Drop**: Intuitive drag-and-drop interface for moving issues between columns
- **Optimistic Updates**: Instant UI feedback without waiting for GitHub API responses
- **Real-time Sync**: Automatic synchronization with GitHub Issues

### 📋 Issue Management

- **Create Issues**: Quick issue creation dialog with status selection
- **Edit Issues**: Detailed issue view with inline editing capabilities
- **Status Management**: Automatic label-based status tracking
  - `status:in-progress` for In Progress column
  - `status:done` for Done column
  - No status label for To Do column
- **State Handling**: Automatically opens/closes issues based on column placement

### 🎨 Advanced Features

- **Label Management**:
  - Create, edit, and delete labels
  - Color-coded label system
  - Department labels (`dept:*`) with special styling
  - Automatic label synchronization

- **Milestone Management**:
  - Create and manage milestones
  - Set due dates for milestones
  - Track milestone progress
  - Filter issues by milestone

- **Powerful Filtering**:
  - Filter by **Author**: See issues created by specific users
  - Filter by **Assignee**: View issues assigned to team members
  - Filter by **Label**: Focus on specific categories
  - Filter by **Milestone**: Track progress on specific goals
  - Multiple active filters with easy clear-all option

### 🚀 Performance Optimizations

- **Optimistic UI Updates**: Changes appear instantly without waiting for API
- **Smart Caching**: Reduces unnecessary API calls to save rate limits
- **Efficient Rendering**: Only re-renders affected components
- **Lazy Loading**: Loads data on-demand for better performance

### 💡 User Experience

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark Mode Ready**: Modern UI that adapts to system preferences
- **Keyboard Shortcuts**: Quick actions without leaving the keyboard
- **Visual Feedback**: Loading states, hover effects, and smooth animations
- **Error Handling**: Graceful error messages and automatic recovery

## Getting Started

### Prerequisites

- Node.js 18+
- GitHub account
- GitHub OAuth App credentials

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd KanbanBoard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Your app name
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy the **Client ID** and generate a **Client Secret**
5. Add these to your `.env.local` file

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Usage

### 1. Authentication
- Click "Sign in with GitHub" on the landing page
- Authorize the application to access your repositories

### 2. Dashboard
- View all your accessible repositories
- Click on a repository to open its Kanban board

### 3. Kanban Board

**Creating Issues:**
- Click the "New Issue" button in the header
- Or click "Add Item" at the bottom of any column
- Fill in title, description, and select initial status

**Moving Issues:**
- Drag and drop issues between columns
- Issues automatically update their labels and state
- Changes sync immediately to GitHub

**Filtering Issues:**
- Use the filter dropdowns in the header
- Apply multiple filters simultaneously
- Click active filter badges to remove them
- Use "Clear all" to reset filters

**Managing Labels:**
- Click "Manage Labels" in the header
- Create new labels with custom colors
- Edit or delete existing labels
- Changes reflect across all issues

**Managing Milestones:**
- Click "Manage Milestones" in the header
- Create milestones with due dates
- Track progress on specific goals
- Assign issues to milestones

**Viewing Issue Details:**
- Click on any issue card
- View full description and metadata
- Edit title, description, labels, and assignees
- Add comments and track activity

## Technical Architecture

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: NextAuth.js
- **API Integration**: Octokit (GitHub REST API)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Drag & Drop**: Custom Kanban component with optimistic updates

### Key Design Decisions

1. **Optimistic Updates**: All drag-and-drop and creation actions update the UI immediately before GitHub confirms, preventing UI lag and snap-back issues

2. **Label-Based Status**: Uses GitHub labels (`status:in-progress`, `status:done`) to track issue status, making the board state portable

3. **Filter-Only Re-renders**: Changing filters only reorganizes existing data without API calls, providing instant results

4. **Eventual Consistency Handling**: Designed to handle GitHub's eventual consistency by trusting local state over API responses during rapid changes

## Project Structure

```
KanbanBoard/
├── app/
│   ├── board/[owner]/[repo]/
│   │   └── page.tsx           # Kanban board page
│   ├── dashboard/
│   │   └── page.tsx           # Repository dashboard
│   └── page.tsx               # Landing page
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── new-issue-dialog.tsx   # Issue creation dialog
│   ├── issue-detail-dialog.tsx # Issue detail viewer/editor
│   ├── label-management-dialog.tsx
│   └── milestone-management-dialog.tsx
├── lib/
│   ├── auth-hook.ts           # Authentication hook
│   └── github.ts              # GitHub API client
└── public/                    # Static assets
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [Radix UI](https://www.radix-ui.com)
- Icons from [Lucide](https://lucide.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
