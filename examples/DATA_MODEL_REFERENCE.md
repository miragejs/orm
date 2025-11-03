# Data Model Reference

Quick reference for the Task Management Dashboard data models, relationships, and factories.

## Model Diagram

```
┌─────────────┐         ┌─────────────┐
│    Team     │◄────┐   │    User     │
│             │     │   │             │
│ - id        │     └───│ - teamId    │
│ - name      │         │ - email     │
│ - managerId │         │ - name      │
└─────────────┘         │ - role      │
       ▲                │ - avatar    │
       │                └──────┬──────┘
       │                       │
       │                       │ hasMany
       │                       ▼
       │                ┌─────────────┐
       │                │    Task     │
       │                │             │
       └────────────────│ - teamId    │
                        │ - assigneeId│
                        │ - title     │
                        │ - status    │
                        │ - priority  │
                        └──────┬──────┘
                               │
                               │ hasMany
                               ▼
                        ┌─────────────┐
                        │   Comment   │
                        │             │
                        │ - taskId    │
                        │ - authorId  │◄────┐
                        │ - content   │     │
                        └─────────────┘     │
                                            │
                                     hasMany from User
```

## Models

### User

**Purpose:** Represents a team member who can be assigned tasks and write comments.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"user-1"` |
| `email` | string | User email (used for login) | `"john.doe@company.com"` |
| `name` | string | Full name | `"John Doe"` |
| `role` | enum | User role | `"user"`, `"manager"`, `"admin"` |
| `avatar` | string | Avatar URL | Faker-generated |
| `bio` | string | User biography | Faker-generated |
| `createdAt` | string | ISO timestamp | `"2024-01-15T10:00:00Z"` |
| `teamId` | string | Foreign key to Team | `"team-1"` |

**Relationships:**
- `belongsTo`: `team` (Team)
- `hasMany`: `tasks` (Task) - Tasks assigned to this user
- `hasMany`: `comments` (Comment) - Comments authored by this user

**Factory Traits:**
```typescript
'user'        // Sets role to 'user'
'manager'     // Sets role to 'manager'
'withAvatar'  // Generates avatar using Faker
'withTasks'   // Creates user with 5-10 random tasks using Faker
```

**Example:**
```typescript
// Create regular user
const user = schema.users.create('user', {
  email: 'john@company.com',
  name: 'John Doe',
  teamId: team.id,
});

// Create manager with avatar
const manager = schema.users.create('manager', 'withAvatar', {
  email: 'jane@company.com',
  name: 'Jane Smith',
});
```

---

### Team

**Purpose:** Represents a team/department containing multiple users.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"team-1"` |
| `name` | string | Team name | `"Engineering"` |
| `department` | string | Department name | `"Product"` |
| `description` | string | Team description | `"Product development team"` |
| `createdAt` | string | ISO timestamp | `"2024-01-01T10:00:00Z"` |
| `managerId` | string | Foreign key to User (manager) | `"user-2"` |

**Relationships:**
- `hasMany`: `members` (User) - All users in this team
- `belongsTo`: `manager` (User) - Team manager
- `hasMany`: `tasks` (Task) - All tasks belonging to team

**Factory Traits:**
```typescript
'withManager'  // Automatically creates and assigns a manager
```

**Example:**
```typescript
// Create team with manager
const team = schema.teams.create('withManager', {
  name: 'Engineering',
  department: 'Product',
  description: 'Product development team',
});

// Access relationships
const members = team.members;        // All team users
const manager = team.manager;        // Team manager
const tasks = team.tasks;            // All team tasks
```

---

### Task

**Purpose:** Represents a work item assigned to a user.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"task-1"` |
| `title` | string | Task title | `"Implement user auth"` |
| `description` | string | Detailed description | Faker-generated |
| `status` | enum | Current status | `"todo"`, `"in_progress"`, `"review"`, `"done"` |
| `priority` | enum | Task priority | `"low"`, `"medium"`, `"high"`, `"urgent"` |
| `dueDate` | string | ISO date | `"2024-12-31"` |
| `createdAt` | string | ISO timestamp | `"2024-01-15T10:00:00Z"` |
| `updatedAt` | string | ISO timestamp | `"2024-01-20T14:30:00Z"` |
| `assigneeId` | string | Foreign key to User | `"user-1"` |
| `teamId` | string | Foreign key to Team | `"team-1"` |

**Relationships:**
- `belongsTo`: `assignee` (User) - User assigned to this task
- `belongsTo`: `team` (Team) - Team this task belongs to
- `hasMany`: `comments` (Comment) - Comments on this task

**Factory Traits:**
```typescript
// Status traits
'todo'        // Sets status to 'todo'
'inProgress'  // Sets status to 'in_progress'
'review'      // Sets status to 'review'
'done'        // Sets status to 'done'

// Priority traits
'lowPriority'  // Sets priority to 'low'
'highPriority' // Sets priority to 'high'
'urgent'       // Sets priority to 'urgent'

// Special traits
'overdue'      // Sets dueDate in the past
'withComments' // Creates task with 3-8 comments
```

**Example:**
```typescript
// Create task in progress
const task = schema.tasks.create('inProgress', 'highPriority', {
  title: 'Implement feature X',
  assigneeId: user.id,
  teamId: team.id,
});

// Create overdue urgent task with comments
const urgentTask = schema.tasks.create(
  'todo', 
  'urgent', 
  'overdue',
  'withComments',
  {
    title: 'Fix critical bug',
    assigneeId: user.id,
  }
);

// Access relationships
const assignee = task.assignee;      // User assigned to task
const comments = task.comments;      // All task comments
const team = task.team;              // Task's team
```

---

### Comment

**Purpose:** Represents a comment/note on a task.

**Attributes:**
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `"comment-1"` |
| `content` | string | Comment text | `"Looking good!"` |
| `createdAt` | string | ISO timestamp | `"2024-01-15T10:00:00Z"` |
| `updatedAt` | string | ISO timestamp | `"2024-01-15T10:00:00Z"` |
| `authorId` | string | Foreign key to User | `"user-1"` |
| `taskId` | string | Foreign key to Task | `"task-1"` |

**Relationships:**
- `belongsTo`: `author` (User) - User who wrote the comment
- `belongsTo`: `task` (Task) - Task this comment belongs to

**Factory Traits:**
```typescript
'recent'  // Created within last 24 hours
'old'     // Created 30+ days ago
'long'    // Long-form content (200+ words)
```

**Example:**
```typescript
// Create recent comment
const comment = schema.comments.create('recent', {
  content: 'Great work on this!',
  authorId: user.id,
  taskId: task.id,
});

// Create old long comment
const oldComment = schema.comments.create('old', 'long', {
  authorId: manager.id,
  taskId: task.id,
});

// Access relationships
const author = comment.author;       // User who wrote comment
const task = comment.task;           // Related task
```

---

## Relationship Queries

### User Queries

```typescript
// Get user with all tasks
const user = schema.users.find('user-1');
const tasks = user.tasks;  // ModelCollection<Task>

// Get user's team
const team = user.team;    // Team model

// Get user's comments
const comments = user.comments;  // ModelCollection<Comment>

// Find users by role
const managers = schema.users.findMany({
  where: { role: 'manager' }
});

// Get all users in a team
const teamMembers = schema.users.findMany({
  where: { teamId: 'team-1' }
});
```

### Team Queries

```typescript
// Get team with members
const team = schema.teams.find('team-1');
const members = team.members;    // ModelCollection<User>
const manager = team.manager;    // User model

// Get all team tasks
const tasks = team.tasks;        // ModelCollection<Task>

// Find team by name
const engTeam = schema.teams.findMany({
  where: { name: 'Engineering' }
}).first();
```

### Task Queries

```typescript
// Get task with assignee and comments
const task = schema.tasks.find('task-1');
const assignee = task.assignee;     // User model
const comments = task.comments;     // ModelCollection<Comment>
const team = task.team;             // Team model

// Get tasks by status
const todoTasks = schema.tasks.findMany({
  where: { status: 'todo' }
});

// Get user's tasks by status
const userInProgressTasks = schema.tasks.findMany({
  where: { 
    assigneeId: 'user-1',
    status: 'in_progress'
  }
});

// Get tasks with pagination and sorting
const page1Tasks = schema.tasks.findMany({
  where: { teamId: 'team-1' },
  limit: 10,
  offset: 0,
  orderBy: { field: 'dueDate', direction: 'asc' }
});
```

### Comment Queries

```typescript
// Get comment with author and task
const comment = schema.comments.find('comment-1');
const author = comment.author;    // User model
const task = comment.task;        // Task model

// Get all comments for a task
const taskComments = schema.comments.findMany({
  where: { taskId: 'task-1' },
  orderBy: { field: 'createdAt', direction: 'asc' }
});

// Get all comments by user
const userComments = schema.comments.findMany({
  where: { authorId: 'user-1' }
});
```

---

## Seed Data Structure

**Default Seeds:**

```typescript
// Test Users (for login)
user@example.com     // Regular user, role: 'user'
manager@example.com  // Manager, role: 'manager'

// Teams (3 total)
- Engineering       (5-7 members)
- Design           (4-6 members)
- Marketing        (4-6 members)

// Tasks (30-50 total)
Distribution by status:
- todo: ~30%
- in_progress: ~25%
- review: ~25%
- done: ~20%

Distribution by priority:
- low: ~30%
- medium: ~40%
- high: ~20%
- urgent: ~10%

// Comments
- 60% of tasks have comments
- 5-15 comments per task (if has comments)
- Random authors from team members
- Chronologically ordered
```

---

## Query Examples by Use Case

### User Dashboard Statistics

```typescript
const user = schema.users.find(currentUserId);
const allTasks = user.tasks;

const stats = {
  todo: allTasks.models.filter(t => t.status === 'todo').length,
  inProgress: allTasks.models.filter(t => t.status === 'in_progress').length,
  review: allTasks.models.filter(t => t.status === 'review').length,
  done: allTasks.models.filter(t => t.status === 'done').length,
  total: allTasks.length,
};
```

### User Dashboard Task List

```typescript
const user = schema.users.find(currentUserId);
const tasks = user.tasks;

// Group by status
const tasksByStatus = {
  todo: tasks.models.filter(t => t.status === 'todo'),
  in_progress: tasks.models.filter(t => t.status === 'in_progress'),
  review: tasks.models.filter(t => t.status === 'review'),
  done: tasks.models.filter(t => t.status === 'done'),
};
```

### Task Detail with Comments

```typescript
const task = schema.tasks.find(taskId);
const comments = task.comments;

// Sort comments by date
const sortedComments = comments.models.sort(
  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

// Get comment authors
const commentsWithAuthors = sortedComments.map(comment => ({
  ...comment,
  author: comment.author,
}));
```

### Team Dashboard with Pagination

```typescript
const team = schema.teams.find(currentUser.teamId);

// Get paginated members
const page = 0;
const pageSize = 10;
const members = schema.users.findMany({
  where: { teamId: team.id },
  limit: pageSize,
  offset: page * pageSize,
  orderBy: { field: 'name', direction: 'asc' }
});

// Get tasks for each member
const membersWithTasks = members.models.map(member => ({
  ...member,
  tasks: member.tasks,
  taskCount: member.tasks.length,
}));
```

---

## Factory Usage Examples

### Creating Related Data

```typescript
// Create user with tasks
const user = schema.users.create('user', {
  email: 'john@company.com',
  teamId: team.id,
});

// Create multiple tasks for user
const tasks = schema.tasks.createMany([
  ['todo', { assigneeId: user.id, title: 'Task 1' }],
  ['inProgress', 'highPriority', { assigneeId: user.id, title: 'Task 2' }],
  ['review', 'withComments', { assigneeId: user.id, title: 'Task 3' }],
  ['done', { assigneeId: user.id, title: 'Task 4' }],
]);

// Create task with comments
const taskWithComments = schema.tasks.create('todo', 'withComments', {
  assigneeId: user.id,
  title: 'Task with discussion',
});
```

### Bulk Creation with Faker

```typescript
import { faker } from '@faker-js/faker';

// Create multiple teams
const teams = schema.teams.createMany([
  ['withManager', { name: 'Engineering', department: 'Product' }],
  ['withManager', { name: 'Design', department: 'Product' }],
  ['withManager', { name: 'Marketing', department: 'Growth' }],
]);

// Create users for each team with random tasks
teams.models.forEach(team => {
  // Use withTasks trait to automatically create tasks
  const members = schema.users.createMany(5, 'user', 'withTasks', {
    teamId: team.id,
  });
  
  // Or create tasks manually with random traits
  members.models.forEach(member => {
    const statusTrait = faker.helpers.arrayElement(['todo', 'inProgress', 'review', 'done']);
    const priorityTrait = faker.helpers.arrayElement(['lowPriority', 'highPriority', 'urgent']);
    
    schema.tasks.create(statusTrait, priorityTrait, {
      assigneeId: member.id,
      teamId: team.id,
    });
  });
});
```

---

**Last Updated:** 2025-11-02

