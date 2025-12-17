# Task Management Dashboard - Getting Started

> A comprehensive real-world example demonstrating `miragejs-orm` capabilities through a task management application with Mock Service Worker integration.

## 🎯 What is This?

This is a fully functional task management dashboard that showcases how to use `miragejs-orm` in a real-world React application. The example demonstrates:

- **MSW Integration** - Mock Service Worker for realistic API patterns
- **Complex Relationships** - 4 models with 8 relationships
- **Factory Traits** - Extensive use of traits for varied seed data
- **TypeScript Enums** - Type-safe roles, statuses, and priorities
- **Advanced Queries** - Pagination, filtering, and sorting
- **Feature Architecture** - Organized by domain, not file type
- **Faker Integration** - Using `arrayElement` and `arrayElements` for randomization

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:5173`

### Login Credentials

**Regular User:**
- Email: `user@example.com`
- Redirects to: User Dashboard

**Manager:**
- Email: `manager@example.com`
- Redirects to: Team Dashboard

(Password is not validated - just hit login)

## 📚 What You'll Learn

### For Beginners
1. How to set up `miragejs-orm` with React
2. Basic model definitions and relationships
3. Creating seed data with factories
4. Querying data from collections

### For Intermediate
5. MSW integration patterns
6. Feature-based architecture
7. Domain-driven schema organization
8. Using factory traits effectively
9. Complex relationship queries

### For Advanced
10. Pagination, filtering, sorting in MSW handlers
11. Faker integration for randomization
12. Scalable project structure
13. Performance patterns

## 🏗️ Architecture Overview

### The Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Material-UI v6** | Component library |
| **React Router 7** | Routing |
| **MSW 2** | API mocking & interception |
| **miragejs-orm** | Data management |
| **Faker.js** | Data generation |
| **Vite** | Build tool |

### Data Flow

```
React Components
      ↓
  API Calls (fetch)
      ↓
MSW Handlers (intercept)
      ↓
 ORM Schema (query)
      ↓
  Return JSON
```

**Key Insight:** The UI never touches the schema directly. All data access goes through MSW-intercepted API calls, demonstrating real-world patterns.

## 📁 Project Structure

```
src/
├── main.tsx              # App entry point (with MSW initialization)
├── Root.tsx              # Root component with router provider
├── routes.tsx            # Route configuration (Data Mode)
├── features/             # Feature modules
│   ├── auth/            # Authentication feature
│   │   ├── Login.tsx          # Login page with action
│   │   ├── api/
│   │   │   ├── login.ts       # login()
│   │   │   └── logout.ts      # logout()
│   │   └── components/
│   │       └── LoginForm.tsx  # Login form UI
│   └── app-layout/      # App layout feature (protected root)
│       ├── AppLayout.tsx      # Protected layout with loader
│       ├── api/
│       │   └── getUser.ts     # getUser()
│       └── components/
│           └── Sidebar.tsx    # Navigation sidebar
└── shared/               # Shared utilities
    ├── components/
    │   └── ErrorBoundary.tsx # Route error boundary
    └── types/           # Shared types & enums
        ├── enums.ts     # UserRole, TaskStatus, TaskPriority
        ├── user.ts      # User type
        └── index.ts

test/                     # Test infrastructure (MSW + ORM)
├── server/               # MSW server setup
│   ├── browser.ts        # MSW browser worker
│   └── handlers/         # API route handlers
│       ├── authHandlers.ts   # POST /api/auth/login, /logout
│       ├── userHandlers.ts   # GET /api/users/me, /:id
│       └── index.ts
└── schema/               # ORM Schema (domain-organized)
    ├── models/           # All model templates together
    │   ├── userModel.ts
    │   ├── teamModel.ts
    │   ├── taskModel.ts
    │   ├── commentModel.ts
    │   └── index.ts
    ├── collections/      # Collection domains
    │   ├── users/        # User collection domain
    │   │   ├── userCollection.ts
    │   │   ├── userFactory.ts
    │   │   └── index.ts
    │   ├── teams/        # Team collection domain
    │   │   ├── teamCollection.ts
    │   │   ├── teamFactory.ts
    │   │   └── index.ts
    │   ├── tasks/        # Task collection domain
    │   │   ├── taskCollection.ts
    │   │   ├── taskFactory.ts
    │   │   └── index.ts
    │   ├── comments/     # Comment collection domain
    │   │   ├── commentCollection.ts
    │   │   ├── commentFactory.ts
    │   │   └── index.ts
    │   └── index.ts
    ├── types/            # Schema type definitions
    │   ├── schema.ts
    │   └── index.ts
    ├── testSchema.ts      # Development schema (logging enabled)
    └── testSchema.ts     # Test schema (logging disabled)
```

### Why This Structure?

**Feature-Based:** Each feature is self-contained with its own route components, API calls, and UI components, making the codebase easy to navigate and understand.

**Loader/Action Pattern:** Data fetching and mutations are handled through React Router loaders and actions instead of hooks, providing built-in caching, error handling, and loading states.

**Single-Purpose API Files:** Each API file contains one function, making them focused and easy to test. No large "god files" that export many functions.

**Shared Types:** Common types like `User` are extracted to `shared/types/` for reuse across features.

**Domain Schema:** ORM collections are organized by entity (`test/schema/collections/users/`, `teams/`, etc.), keeping models, factories, and relationships together.

**Separation of Concerns:** Features, routes, API clients, MSW handlers, and ORM schema are clearly separated into distinct layers.

## 🎨 Features Walkthrough

### 0. Authentication & Protected Routes

**What it shows:**
- Gradient login page with email authentication
- Protected app layout with navigation sidebar
- User avatar menu with logout functionality
- Automatic redirect when not authenticated

**Tech Stack:**
- **React Router 7** - Loaders and Actions for data fetching and mutations
- **MSW** - Intercepts API calls for `/api/auth/login` and `/api/auth/logout`
- **Cookie-based sessions** - Simulated with MSW response headers

**Implementation Details:**

```typescript
// src/routes/auth/LoginPage.tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  
  try {
    await login(email); // API call
    return { redirect: '/app' };
  } catch (error) {
    return { error: error.message };
  }
}

// src/features/app-layout/AppLayout.tsx (Protected Route)
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await getUser(); // API call from ./api/getUser
    return { user };
  } catch (error) {
    // Not authenticated - redirect to login
    return redirect('/auth');
  }
}

// test/server/handlers/authHandlers.ts
http.post('/api/auth/login', async ({ request }) => {
  const { email } = await request.json();
  const user = testSchema.users.find({ email }); // ORM query
  
  if (!user) {
    return HttpResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  return HttpResponse.json(
    { user: { ...user.attrs } },
    {
      headers: {
        'Set-Cookie': `userId=${user.id}; Path=/; HttpOnly`,
      },
    },
  );
});
```

**Try It:**
1. Visit the app - redirected to `/auth`
2. Enter `user@example.com` or `manager@example.com`
3. Automatically redirected to `/app/dashboard`
4. Click avatar → Logout → Redirected back to login

### 1. User Dashboard

**What it shows:**
- Task statistics by status (TODO, IN_PROGRESS, REVIEW, DONE)
- Tasks grouped and displayed by status
- Task detail dialog with full information
- Comments with author information
- Navigation to team dashboard

**ORM Features:**
```typescript
// In MSW handler
http.get('/api/users/:id/tasks', ({ params }) => {
  const user = schema.users.find(params.id);
  const tasks = user.tasks; // HasMany relationship
  return HttpResponse.json(tasks.models);
});
```

**Try It:**
1. Login as `user@example.com`
2. View statistics at top
3. Scroll through task sections
4. Click a task card
5. View comments with authors

### 2. Team Dashboard

**What it shows:**
- Team members in a collapsible table
- User rows that expand to show their tasks
- Pagination controls
- Sorting by name, task count
- Filtering by role and status

**ORM Features:**
```typescript
// Pagination + Sorting + Filtering
http.get('/api/teams/:id/members', ({ request, params }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 0;
  const limit = Number(url.searchParams.get('limit')) || 10;
  const sortBy = url.searchParams.get('sortBy') || 'name';
  const role = url.searchParams.get('role');
  
  const members = schema.users.findMany({
    where: {
      teamId: params.id,
      ...(role && { role }),
    },
    limit,
    offset: page * limit,
    orderBy: { field: sortBy, direction: 'asc' },
  });
  
  return HttpResponse.json(members);
});
```

**Try It:**
1. Navigate to team dashboard
2. Click expand icon on user rows
3. Try pagination at bottom
4. Click column headers to sort
5. Use filter dropdowns

### 3. Authentication Flow

**What it shows:**
- Email-based login
- Role-based routing
- Session management with localStorage
- Protected routes

**ORM Features:**
```typescript
// In auth handler
http.post('/api/auth/login', async ({ request }) => {
  const { email } = await request.json();
  
  const user = schema.users.findMany({
    where: { email }
  }).first();
  
  if (!user) {
    return HttpResponse.json(
      { error: 'User not found' },
      { status: 401 }
    );
  }
  
  return HttpResponse.json(user);
});
```

## 🔍 ORM Features in Action

### 1. Models with TypeScript Enums

**Location:** `src/types/enums.ts`, `test/schema/models/*.ts`

```typescript
// Shared enums
export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Model definition
interface TaskAttrs {
  id: string;
  title: string;
  status: TaskStatus;  // Type-safe!
  priority: TaskPriority;
  // ...
}
```

### 2. Relationships

**Location:** `test/schema/*/relationships.ts`

```typescript
// User relationships
export const userRelationships = {
  belongsTo: {
    team: 'teams',
  },
  hasMany: {
    tasks: 'tasks',
    comments: 'comments',
  },
};

// Usage in handlers
const user = schema.users.find(userId);
const tasks = user.tasks;         // ModelCollection<Task>
const team = user.team;           // Team model
const comments = user.comments;   // ModelCollection<Comment>
```

**All Relationships:**
- User ←→ Team (belongsTo/hasMany)
- User → Tasks (hasMany)
- User → Comments (hasMany)
- Task → User (belongsTo)
- Task → Team (belongsTo)
- Task → Comments (hasMany)
- Comment → User (belongsTo)
- Comment → Task (belongsTo)

### 3. Factory Traits

**Location:** `test/schema/*/factory.ts`

```typescript
// Task factory with traits
factory()
  .model(taskModel)
  .attrs({
    title: () => faker.lorem.sentence(),
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    // ...
  })
  .traits({
    todo: { status: TaskStatus.TODO },
    inProgress: { status: TaskStatus.IN_PROGRESS },
    review: { status: TaskStatus.REVIEW },
    done: { status: TaskStatus.DONE },
    lowPriority: { priority: TaskPriority.LOW },
    highPriority: { priority: TaskPriority.HIGH },
    urgent: { priority: TaskPriority.URGENT },
    overdue: { dueDate: () => faker.date.past().toISOString() },
  })
  .create();

// Usage: Combine traits!
schema.tasks.create('todo', 'urgent', {
  assigneeId: user.id,
});
```

### 4. Faker Integration for Randomization

**Location:** `test/schema/seeds.ts`

```typescript
import { faker } from '@faker-js/faker';

// Random trait selection
const statusTrait = faker.helpers.arrayElement([
  'todo',
  'inProgress',
  'review',
  'done',
]);

// Weighted random selection
const priorityTrait = faker.helpers.weightedArrayElement([
  { weight: 3, value: 'lowPriority' },
  { weight: 4, value: null }, // Medium (no trait)
  { weight: 2, value: 'highPriority' },
  { weight: 1, value: 'urgent' },
]);

// Random subset selection
const tasksWithComments = faker.helpers.arrayElements(
  allTasks,
  Math.floor(allTasks.length * 0.6) // 60% of tasks
);

// Random count
const commentCount = faker.number.int({ min: 5, max: 15 });
```

### 5. Seed Data with withTasks Trait

**Location:** `test/schema/seeds.ts`

```typescript
// Create teams
const teams = schema.teams.createMany([
  ['withManager', { name: 'Engineering', department: 'Product' }],
  ['withManager', { name: 'Design', department: 'Product' }],
  ['withManager', { name: 'Marketing', department: 'Growth' }],
]);

// Create users with automatic tasks
teams.models.forEach(team => {
  // withTasks trait automatically creates 5-10 random tasks
  schema.users.createMany(5, 'user', 'withTasks', {
    teamId: team.id,
  });
});
```

### 6. Collection Queries

**Location:** Any `test/server/handlers/*.ts`

```typescript
// Simple find
const user = schema.users.find(userId);

// Find with where clause
const todoTasks = schema.tasks.findMany({
  where: {
    assigneeId: userId,
    status: TaskStatus.TODO,
  },
});

// Pagination
const page1 = schema.tasks.findMany({
  limit: 10,
  offset: 0,
});

// Sorting
const sortedTasks = schema.tasks.findMany({
  orderBy: {
    field: 'dueDate',
    direction: 'asc',
  },
});

// Combined
const results = schema.tasks.findMany({
  where: { status: TaskStatus.IN_PROGRESS },
  limit: 20,
  offset: 40,
  orderBy: { field: 'priority', direction: 'desc' },
});
```

### 7. Nested Relationship Access

**Location:** `test/server/handlers/` (future task handlers)

```typescript
http.get('/api/tasks/:id', ({ params }) => {
  const task = schema.tasks.find(params.id);
  const comments = task.comments; // HasMany
  
  // Access nested relationships
  const commentsWithAuthors = comments.models.map(comment => ({
    ...comment,
    author: comment.author, // BelongsTo through comment
  }));
  
  return HttpResponse.json({
    ...task,
    assignee: task.assignee, // BelongsTo
    team: task.team,         // BelongsTo
    comments: commentsWithAuthors,
  });
});
```

## 📖 Code Examples

### Creating Data with Random Traits

```typescript
// Manual task creation with random traits
const allUsers = schema.users.all().models;

allUsers.forEach(user => {
  const taskCount = faker.number.int({ min: 4, max: 8 });
  
  for (let i = 0; i < taskCount; i++) {
    const statusTrait = faker.helpers.arrayElement([
      'todo',
      'inProgress',
      'review',
      'done',
    ]);
    
    const priorityTrait = faker.helpers.weightedArrayElement([
      { weight: 3, value: 'lowPriority' },
      { weight: 4, value: null },
      { weight: 2, value: 'highPriority' },
      { weight: 1, value: 'urgent' },
    ]);
    
    const isOverdue = faker.datatype.boolean(0.15); // 15% chance
    
    const traits = [
      statusTrait,
      priorityTrait,
      isOverdue ? 'overdue' : null,
    ].filter(Boolean);
    
    schema.tasks.create(...traits, {
      assigneeId: user.id,
      teamId: user.teamId,
    });
  }
});
```

### Creating Comments with Random Authors

```typescript
// Random comment creation
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

## 🧪 Testing Checklist

### Authentication
- [ ] Login with `user@example.com`
- [ ] Login with `manager@example.com`
- [ ] Verify redirect to correct dashboard
- [ ] Logout clears session

### User Dashboard
- [ ] Statistics display correctly
- [ ] Tasks grouped by 4 statuses
- [ ] Task counts match statistics
- [ ] Task detail dialog opens
- [ ] Comments display with authors
- [ ] Link to team dashboard works

### Team Dashboard
- [ ] User rows display
- [ ] Expand/collapse works
- [ ] Pagination works
- [ ] Sorting works
- [ ] Filtering works
- [ ] Task counts accurate

### Data Relationships
- [ ] User → Tasks working
- [ ] User → Team working
- [ ] Task → Comments working
- [ ] Comment → Author working
- [ ] Team → Members working

## 📝 Additional Documentation

- **[EXAMPLE_PROJECT_PLAN.md](../EXAMPLE_PROJECT_PLAN.md)** - Full architecture & implementation plan (685 lines)
- **[DATA_MODEL_REFERENCE.md](../DATA_MODEL_REFERENCE.md)** - Complete model specifications & query examples (518 lines)
- **[IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md)** - Detailed task breakdown by phase (396 lines)

## 🚧 Current Status

**Phase:** Planning & Documentation Complete ✅

**Next Phase:** Phase 1 - Project Setup & Schema

See [IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md) for detailed progress.

## ❓ Troubleshooting

**MSW not working?**
- Check console for MSW startup message
- Ensure `worker.start()` called in `main.tsx`
- Verify handler patterns match API calls

**TypeScript errors?**
- Run `pnpm type-check`
- Ensure enums imported correctly
- Check model attribute types

**Data not loading?**
- Check Network tab (should see MSW)
- Verify seeds ran (console logs)
- Check MSW handler patterns

**Build errors?**
- Clear `node_modules` and reinstall
- Verify Node.js 18+
- Check dependencies installed

## 🤝 Contributing

Want to improve this example? Ideas:
- Add task CRUD operations
- Implement search
- Add more filters
- Enhance UI/UX
- Add animations
- Improve accessibility

## 📄 License

Same as miragejs-orm library.

---

**Ready to explore?** Start with `pnpm install && pnpm run dev` and dive in! 🚀
