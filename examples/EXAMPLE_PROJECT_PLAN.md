# Task Management Dashboard - Example Project Plan

## Overview

A comprehensive real-world example demonstrating the full capabilities of `miragejs-orm` through a task management dashboard application.

## Project Goals

- Showcase all major ORM features in a realistic application
- Provide a runnable example for developers to explore
- Demonstrate best practices for schema design and data relationships
- Serve as a testing ground for real-world usage patterns

## Technical Stack

### Frontend
- **Framework**: React 18+
- **UI Library**: Material UI v6
- **Routing**: React Router 7
- **Build Tool**: Vite
- **Language**: TypeScript
- **API Mocking**: Mock Service Worker (MSW)
- **Data Generation**: Faker.js

### Backend (Simulated)
- **ORM**: miragejs-orm
- **Mock Server**: MSW handlers with ORM
- **Data**: In-memory schema with seeds and factories

## Project Structure

```
/examples/
├── task-management-dashboard/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── features/                   # Feature-based structure
│   │   │   ├── auth/
│   │   │   │   ├── api/
│   │   │   │   │   └── authApi.ts
│   │   │   │   ├── components/
│   │   │   │   │   └── LoginForm.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── useAuth.tsx
│   │   │   │   └── LoginPage.tsx      # Feature root
│   │   │   ├── user-dashboard/
│   │   │   │   ├── api/
│   │   │   │   │   └── userTasksApi.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── TaskStatistics.tsx
│   │   │   │   │   ├── TaskCard.tsx
│   │   │   │   │   ├── TaskSection.tsx
│   │   │   │   │   └── TaskDetailDialog.tsx
│   │   │   │   └── UserDashboard.tsx  # Feature root
│   │   │   └── team-dashboard/
│   │   │       ├── api/
│   │   │       │   └── teamApi.ts
│   │   │       ├── components/
│   │   │       │   ├── TeamMembersTable.tsx
│   │   │       │   └── TaskSubRow.tsx
│   │   │       └── TeamDashboard.tsx  # Feature root
│   │   ├── components/                 # Shared components
│   │   │   ├── AppNavigation.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── CommentList.tsx
│   │   ├── hooks/                      # Shared hooks
│   │   │   └── usePagination.ts
│   │   ├── utils/
│   │   │   └── formatters.ts
│   │   └── types/                      # Shared types & enums
│   │       ├── index.ts
│   │       └── enums.ts
│   ├── test/                           # Test infrastructure & MSW
│   │   ├── mocks/
│   │   │   ├── browser.ts             # MSW browser setup
│   │   │   └── handlers/              # API handlers
│   │   │       ├── auth.handlers.ts
│   │   │       ├── users.handlers.ts
│   │   │       ├── teams.handlers.ts
│   │   │       ├── tasks.handlers.ts
│   │   │       ├── comments.handlers.ts
│   │   │       └── index.ts
│   │   └── schema/                     # ORM Schema (domain structure)
│   │       ├── models/                 # All model templates together
│   │       │   ├── userModel.ts
│   │       │   ├── teamModel.ts
│   │       │   ├── taskModel.ts
│   │       │   ├── commentModel.ts
│   │       │   └── index.ts
│   │       ├── collections/            # Collection domains
│   │       │   ├── users/              # User collection domain
│   │       │   │   ├── userCollection.ts
│   │       │   │   ├── userFactory.ts
│   │       │   │   └── index.ts
│   │       │   ├── teams/              # Team collection domain
│   │       │   │   ├── teamCollection.ts
│   │       │   │   ├── teamFactory.ts
│   │       │   │   └── index.ts
│   │       │   ├── tasks/              # Task collection domain
│   │       │   │   ├── taskCollection.ts
│   │       │   │   ├── taskFactory.ts
│   │       │   │   └── index.ts
│   │       │   ├── comments/           # Comment collection domain
│   │       │   │   ├── commentCollection.ts
│   │       │   │   ├── commentFactory.ts
│   │       │   │   └── index.ts
│   │       │   └── index.ts
│   │       ├── types/                  # Schema type definitions
│   │       │   ├── schema.ts
│   │       │   └── index.ts
│   │       ├── setupSchema.ts          # Schema initialization
│   │       ├── seeds.ts                # Seed data
│   │       └── index.ts                # Main export
│   └── README.md
```

## Data Model Design

### 1. User Model

**Attributes:**
```typescript
enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
}

interface UserAttrs {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;           // Faker-generated avatar URL
  bio: string;
  createdAt: string;
  teamId: string;
}
```

**Relationships:**
- `belongsTo`: `team`
- `hasMany`: `tasks` (as assignee)
- `hasMany`: `comments` (as author)

**Factory Traits:**
- `user`: Regular user role (UserRole.USER)
- `manager`: Manager role (UserRole.MANAGER)
- `withAvatar`: Generates avatar using Faker
- `withTasks`: Creates user with 5-10 random tasks using Faker

### 2. Team Model

**Attributes:**
```typescript
interface TeamAttrs {
  id: string;
  name: string;
  department: string;
  description: string;
  createdAt: string;
  managerId: string;
}
```

**Relationships:**
- `hasMany`: `members` (users)
- `belongsTo`: `manager` (user)
- `hasMany`: `tasks` (through members)

**Factory Traits:**
- `withMembers`: Creates team with 3-7 members
- `withManager`: Assigns a manager

### 3. Task Model

**Attributes:**
```typescript
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

interface TaskAttrs {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  assigneeId: string;
  teamId: string;
}
```

**Relationships:**
- `belongsTo`: `assignee` (user)
- `belongsTo`: `team`
- `hasMany`: `comments`

**Factory Traits:**
- `todo`: Status = TaskStatus.TODO
- `inProgress`: Status = TaskStatus.IN_PROGRESS
- `review`: Status = TaskStatus.REVIEW
- `done`: Status = TaskStatus.DONE
- `lowPriority`: Priority = TaskPriority.LOW
- `highPriority`: Priority = TaskPriority.HIGH
- `urgent`: Priority = TaskPriority.URGENT
- `overdue`: dueDate in the past

### 4. Comment Model

**Attributes:**
```typescript
interface CommentAttrs {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  taskId: string;
}
```

**Relationships:**
- `belongsTo`: `author` (user)
- `belongsTo`: `task`

**Factory Traits:**
- `recent`: Created within last 24 hours
- `old`: Created 30+ days ago

## Schema Setup

### Seeds Strategy

**Priority: Use traits extensively to demonstrate ORM capabilities**

**Test Users (for login):**
```typescript
// Regular user: user@example.com / password
const regularUser = schema.users.create('user', {
  email: 'user@example.com',
  name: 'John Doe',
});

// Manager: manager@example.com / password
const manager = schema.users.create('manager', {
  email: 'manager@example.com',
  name: 'Jane Smith',
});
```

**Team Structure:**
- 3 teams total (Engineering, Design, Marketing)
- Each team has 1 manager + 4-6 members
- Use `withManager` trait for teams

**Task Distribution:**
- 40-60 tasks total distributed across all users
- Use `faker.helpers.arrayElement()` to randomly pick traits:
  - Status traits: `todo`, `inProgress`, `review`, `done` (weighted distribution)
  - Priority traits: `lowPriority`, default/medium, `highPriority`, `urgent`
  - Special: `overdue` for ~15% of tasks
- 60% of tasks should have comments (create separately)

**Comments:**
- 5-15 comments per task using `faker.number.int({ min: 5, max: 15 })`
- Use `faker.helpers.arrayElement(['recent', 'old'])` for age variation
- Use `faker.helpers.arrayElement(teamMembers)` for random authors
- Manually ensure chronological order by creation date

### Factory Usage Example

```typescript
import { faker } from '@faker-js/faker';

// Create teams with managers
const teams = schema.teams.createMany([
  ['withManager', { name: 'Engineering', department: 'Product' }],
  ['withManager', { name: 'Design', department: 'Product' }],
  ['withManager', { name: 'Marketing', department: 'Growth' }],
]);

// Create users across teams using withTasks trait
teams.models.forEach(team => {
  // Create regular members with tasks
  schema.users.createMany(5, 'user', 'withTasks', { teamId: team.id });
});

// Or create tasks manually with random traits using Faker
const allUsers = schema.users.all().models;
allUsers.forEach(user => {
  const taskCount = faker.number.int({ min: 4, max: 8 });
  
  for (let i = 0; i < taskCount; i++) {
    // Randomly pick status and priority traits
    const statusTrait = faker.helpers.arrayElement(['todo', 'inProgress', 'review', 'done']);
    const priorityTrait = faker.helpers.weightedArrayElement([
      { weight: 3, value: 'lowPriority' },
      { weight: 4, value: null }, // No priority trait (medium)
      { weight: 2, value: 'highPriority' },
      { weight: 1, value: 'urgent' },
    ]);
    const isOverdue = faker.datatype.boolean(0.15); // 15% chance
    
    const traits = [statusTrait, priorityTrait, isOverdue ? 'overdue' : null].filter(Boolean);
    
    schema.tasks.create(...traits, {
      assigneeId: user.id,
      teamId: user.teamId,
    });
  }
});

// Create comments for random tasks using Faker
const allTasks = schema.tasks.all().models;
const tasksWithComments = faker.helpers.arrayElements(
  allTasks,
  Math.floor(allTasks.length * 0.6)
);

tasksWithComments.forEach(task => {
  const commentCount = faker.number.int({ min: 5, max: 15 });
  const team = task.team;
  const teamMembers = team.members.models;
  
  for (let i = 0; i < commentCount; i++) {
    const ageTrait = faker.helpers.arrayElement(['recent', 'old']);
    const author = faker.helpers.arrayElement(teamMembers);
    
    schema.comments.create(ageTrait, {
      taskId: task.id,
      authorId: author.id,
    });
  }
});
```

## UI Implementation Plan

### Phase 1: Project Setup & Schema (Week 1)

**Tasks:**
1. ✅ Create project structure with feature-based folders
2. ✅ Initialize Vite + React + TypeScript project
3. ✅ Install dependencies (MUI, React Router, MSW, Faker, ORM)
4. ✅ Configure TypeScript with path aliases
5. ✅ Create shared enums (UserRole, TaskStatus, TaskPriority)
6. ✅ Define all model templates in `/test/schema/models/`
7. ✅ Create domain folders for each collection
8. ✅ Create factories with traits (prioritize trait usage)
9. ✅ Set up relationships for each collection
10. ✅ Implement seed data generation using traits
11. ✅ Initialize schema in `/test/schema/index.ts`
12. ✅ Set up MSW browser instance
13. ✅ Create basic MSW handlers for each entity

**Deliverables:**
- Working build setup with feature structure
- Fully seeded schema with realistic data using traits
- MSW configured and ready for API interception
- Shared enums defined

### Phase 2: Authentication & Navigation (Week 2)

**Tasks:**
1. ✅ Create auth MSW handlers (`POST /api/auth/login`)
2. ✅ Create auth API client (`authApi.ts`)
3. ✅ Implement auth context (store current user in localStorage)
4. ✅ Create LoginForm component
5. ✅ Create LoginPage with email/password inputs
6. ✅ Create AppNavigation component with links
7. ✅ Add UserAvatar component with menu
8. ✅ Set up React Router with routes
9. ✅ Implement protected route wrapper
10. ✅ Add role-based redirect logic (user → `/dashboard`, manager → `/team`)
11. ✅ Implement logout functionality

**Deliverables:**
- Functional login flow via API
- Navigation between pages
- User session management with localStorage
- Protected routes based on authentication

### Phase 3: User Dashboard (Week 3)

**Components to Build:**

**1. TaskStatistics Component**
- Displays 4 cards with status counts
- Shows percentage of total
- Color-coded by status
- Uses MUI `Grid` + `Card` components

**2. TaskSection Component**
- Section header with status + count
- Divider line
- Grid of TaskCard components

**3. TaskCard Component**
- Compact card with:
  - Title (truncated)
  - Priority badge
  - Due date
  - Comment count icon
  - Click to open detail dialog

**4. TaskDetailDialog Component**
- Full-screen dialog (mobile) or large modal (desktop)
- Complete task information
- CommentList with author avatars
- Close button

**Tasks:**
1. ✅ Create MSW handlers for user tasks endpoints
   - `GET /api/users/:id/tasks` - Get all user tasks
   - `GET /api/tasks/:id` - Get task details
   - `GET /api/tasks/:id/comments` - Get task comments
2. ✅ Create user tasks API client (`userTasksApi.ts`)
3. ✅ Create TaskStatistics component with API data
4. ✅ Build TaskCard with MUI Card component
5. ✅ Implement TaskSection with grouped tasks
6. ✅ Create UserDashboard layout
7. ✅ Add TaskDetailDialog with task details + comments
8. ✅ Implement CommentList component
9. ✅ Add link to team dashboard
10. ✅ Add loading states and error handling

**Deliverables:**
- Fully functional user dashboard fetching via API
- Task grouping by status
- Task detail dialog with comments
- Statistics display from API data

### Phase 4: Team Dashboard (Week 4)

**Components to Build:**

**1. TeamMembersTable Component**
- Collapsible table with user rows
- Sub-rows showing user's tasks
- Columns: Name, Email, Role, Task Count, Status Distribution
- MUI `Table` with `Collapse` functionality

**2. Pagination Controls**
- MUI `TablePagination` component
- Server-side pagination using schema queries

**3. Filtering & Sorting**
- Filter by role, status
- Sort by name, task count, etc.
- Using schema's `findMany` with queries

**Tasks:**
1. ✅ Create MSW handlers for team endpoints
   - `GET /api/teams/:id` - Get team details
   - `GET /api/teams/:id/members` - Get team members with pagination/filters
   - `GET /api/users/:id/tasks` - Get user's tasks
2. ✅ Create team API client (`teamApi.ts`) with query params
3. ✅ Create TeamMembersTable with collapse
4. ✅ Implement user row with task sub-rows
5. ✅ Add pagination with API query params (`page`, `limit`)
6. ✅ Implement sorting with API (`sortBy`, `sortOrder`)
7. ✅ Add filter controls with API (`role`, `status`)
8. ✅ Create TeamDashboard layout
9. ✅ Handle empty states and loading
10. ✅ Use `usePagination` hook for state management

**Deliverables:**
- Collapsible team member table
- Working pagination, sorting, filtering via API
- Proper query param handling in MSW handlers

### Phase 5: Polish & Documentation (Week 5)

**Tasks:**
1. ✅ Add loading states
2. ✅ Improve error handling
3. ✅ Add empty state illustrations
4. ✅ Improve responsive design
5. ✅ Add keyboard navigation
6. ✅ Write comprehensive README
7. ✅ Add inline code comments
8. ✅ Create quick start guide
9. ✅ Add screenshots/demo GIF

**Deliverables:**
- Polished, production-ready example
- Complete documentation
- Easy setup instructions

## Features Showcasing ORM Capabilities

### ✅ Model Definition with Enums
- Demonstrated in: All model files + shared enums
- Shows: Type-safe attribute definitions with TypeScript enums

### ✅ Relationships
- **BelongsTo**: User → Team, Task → User, Task → Team, Comment → User, Comment → Task
- **HasMany**: User → Tasks, User → Comments, Team → Users, Task → Comments
- Demonstrated in: MSW handlers accessing relationships

### ✅ Factory Traits (Prioritized)
- User: `user`, `manager`
- Task: `todo`, `inProgress`, `review`, `done`, `lowPriority`, `highPriority`, `urgent`, `overdue`
- Comment: `recent`, `old`
- Demonstrated in: Extensive seed data generation

### ✅ Seeds with Traits
- Demonstrated in: Initial data loading with trait-based creation
- Shows: Realistic multi-model seeding using factory traits

### ✅ Collection Queries in MSW Handlers
```typescript
// In MSW handler - Pagination
http.get('/api/tasks', ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 0;
  const limit = Number(url.searchParams.get('limit')) || 10;
  
  const tasks = schema.tasks.findMany({
    limit,
    offset: page * limit,
  });
  
  return HttpResponse.json(tasks);
});

// Filtering by status and user
http.get('/api/users/:id/tasks', ({ params }) => {
  const tasks = schema.tasks.findMany({
    where: { assigneeId: params.id, status: TaskStatus.TODO }
  });
  return HttpResponse.json(tasks);
});

// Sorting
http.get('/api/tasks', ({ request }) => {
  const url = new URL(request.url);
  const tasks = schema.tasks.findMany({
    orderBy: { 
      field: url.searchParams.get('sortBy') || 'dueDate',
      direction: url.searchParams.get('sortOrder') || 'asc'
    }
  });
  return HttpResponse.json(tasks);
});
```

### ✅ Relationship Loading in Handlers
```typescript
// MSW handler - Load user with tasks
http.get('/api/users/:id', ({ params }) => {
  const user = schema.users.find(params.id);
  const tasks = user.tasks; // Automatic relationship
  
  return HttpResponse.json({
    ...user,
    tasks: tasks.models,
  });
});

// Load task with comments and authors
http.get('/api/tasks/:id', ({ params }) => {
  const task = schema.tasks.find(params.id);
  const comments = task.comments;
  
  const commentsWithAuthors = comments.models.map(comment => ({
    ...comment,
    author: comment.author, // Nested relationship
  }));
  
  return HttpResponse.json({
    ...task,
    comments: commentsWithAuthors,
  });
});
```

### ✅ Creating Data with Traits
```typescript
// In seeds - Create mix of tasks with traits
schema.tasks.createMany([
  ['todo', { assigneeId: user.id }],
  ['inProgress', 'urgent', { assigneeId: user.id }],
  ['review', { assigneeId: user.id }],
  ['done', { assigneeId: user.id }],
]);
```

### ✅ Collection Methods
- `all()`: Get all records
- `find()`: Get record by ID
- `findMany()`: Query with filters/pagination/sorting
- `create()`: Create single record
- `createMany()`: Bulk creation with traits

### ✅ MSW Integration
- Demonstrates: Real-world API layer with mock server
- Shows: How to use ORM in request handlers
- Benefits: Separates data layer from UI, realistic API patterns

## Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Login with regular user
- [ ] Login with manager
- [ ] Verify redirect to correct dashboard
- [ ] Logout functionality

**User Dashboard:**
- [ ] Statistics display correctly
- [ ] Tasks grouped by status
- [ ] Task counts match statistics
- [ ] Task detail dialog opens/closes
- [ ] Comments display with authors
- [ ] Navigation to team dashboard

**Team Dashboard:**
- [ ] User rows display correctly
- [ ] Task sub-rows expand/collapse
- [ ] Pagination works
- [ ] Sorting works (each column)
- [ ] Filtering works (role, status)
- [ ] Task counts accurate

**Relationships:**
- [ ] User → Tasks working
- [ ] User → Team working
- [ ] Task → Comments working
- [ ] Comment → Author working
- [ ] Team → Members working

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.0.2",
    "@mui/material": "^6.1.7",
    "@mui/icons-material": "^6.1.7",
    "@emotion/react": "^11.13.5",
    "@emotion/styled": "^11.13.5",
    "@faker-js/faker": "^9.2.0",
    "msw": "^2.6.5",
    "miragejs-orm": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.1"
  }
}
```

## Success Metrics

- [ ] All 4 models properly defined with TypeScript enums
- [ ] Domain-based schema structure in `/test/schema/`
- [ ] 50+ realistic seed records generated using traits
- [ ] MSW configured with all necessary API handlers
- [ ] All 3 main pages functional (Login, UserDashboard, TeamDashboard)
- [ ] All ORM features demonstrated through MSW handlers
- [ ] Pagination, sorting, filtering working via API
- [ ] Feature-based directory structure implemented
- [ ] Complete documentation with API examples
- [ ] Zero TypeScript errors
- [ ] Runnable with `npm install && npm run dev`

## Future Enhancements (Post-Release)

- Add task creation/editing (CRUD operations)
- Implement real-time updates simulation
- Add task assignment functionality
- Create notification system
- Add search functionality
- Implement dark mode
- Add data export features
- Create mobile-optimized views

---

## Next Steps

1. Review and approve this plan
2. Create project structure
3. Set up dependencies
4. Start with Phase 1 (Schema setup)
5. Iterate through phases
6. Test and polish
7. Document and release

**Estimated Timeline:** 3-4 weeks for full implementation
**Priority:** High (blocker for 1.0 release)

