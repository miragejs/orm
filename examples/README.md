# Examples

This directory contains real-world example applications demonstrating the capabilities of `miragejs-orm`.

## Available Examples

### 🎯 Task Management Dashboard

**Status:** 📋 Planning Phase - Documentation Complete  
**Path:** `./task-management-dashboard/`  
**Tech Stack:** React + Material UI + React Router 7 + MSW + Faker

A comprehensive task management application demonstrating real-world `miragejs-orm` usage:

**Key Features:**
- ✅ MSW integration for realistic API patterns
- ✅ 4 models with 8 relationships (User, Team, Task, Comment)
- ✅ Extensive factory trait usage (`withTasks`, status traits, priority traits)
- ✅ TypeScript enums (UserRole, TaskStatus, TaskPriority)
- ✅ Faker integration (`arrayElement`, `arrayElements`, `weightedArrayElement`)
- ✅ Domain-driven schema organization
- ✅ Advanced queries (pagination, filtering, sorting)
- ✅ Feature-based architecture

**Documentation:**
- **[Getting Started →](./task-management-dashboard/README.md)** - Main guide with examples (500+ lines)
- **[Project Plan →](./EXAMPLE_PROJECT_PLAN.md)** - Full architecture & implementation plan (685 lines)
- **[Data Models →](./DATA_MODEL_REFERENCE.md)** - Model reference & query examples (518 lines)
- **[Checklist →](./IMPLEMENTATION_CHECKLIST.md)** - Task breakdown & progress tracker (396 lines)

## Quick Start

```bash
# Navigate to the example
cd examples/task-management-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

## Purpose

These examples serve multiple purposes:

1. **Learning**: Understand how to use `miragejs-orm` in real applications
2. **Testing**: Validate the library works in production-like scenarios
3. **Showcasing**: Demonstrate best practices and patterns
4. **Prototyping**: Playground for trying new features

## Contributing Examples

Have an idea for an example? We'd love to see it! Examples should:

- Demonstrate specific ORM features
- Include complete documentation
- Be runnable with minimal setup
- Use realistic data and scenarios
- Follow TypeScript best practices

## Example Structure

Each example should follow this structure:

```
example-name/
├── README.md           # Quick start and overview
├── package.json        # Dependencies
├── src/
│   ├── schema/        # ORM models, factories, seeds
│   └── ...            # Application code
└── ...
```

## Questions?

- 📖 [Main Library Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

