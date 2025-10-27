# 🧭 Contributing to MirageJS ORM

First off — thank you for taking the time to contribute!  
This project is an open-source rework of MirageJS that focuses on its ORM capabilities, modern type system, and clean API.  
Contributions, discussions, and feedback are very welcome ❤️

---

## 🪜 Table of contents
- [🧭 Contributing to MirageJS ORM](#-contributing-to-miragejs-orm)
  - [🪜 Table of contents](#-table-of-contents)
  - [⚙️ Getting started](#️-getting-started)
  - [🧑‍💻 Development workflow](#-development-workflow)
  - [📝 Commit convention](#-commit-convention)
    - [Common types](#common-types)
    - [Examples](#examples)
    - [Notes](#notes)
  - [🔀 Pull requests](#-pull-requests)
  - [🧪 Testing](#-testing)
  - [🎨 Code style](#-code-style)
  - [🚀 Releases](#-releases)
  - [❤️ Thank you](#️-thank-you)

---

## ⚙️ Getting started

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/&lt;your-username&gt;/orm.git
   cd orm
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Run the full local build check (lint, types, tests):**
   ```bash
   pnpm run check-all
   ```

---

## 🧑‍💻 Development workflow

All work should be done on feature branches, not directly on `main`.

1. Create a new branch:
   ```bash
   git checkout -b feat/add-new-feature // fix/issue-with-factory
   ```

2. Make your changes and commit them following the **Conventional Commits** format (see below).

3. Push your branch and open a Pull Request to `main`.

---

## 📝 Commit convention

This project follows the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification.  
Each commit message must have a clear, structured format:

```
&lt;type&gt;[optional scope]: &lt;short summary&gt;
```

### Common types
| Type | Use for |
|------|----------|
| **feat** | New features |
| **fix** | Bug fixes |
| **docs** | Documentation only changes |
| **style** | Code style (formatting, missing semicolons, etc.) |
| **refactor** | Code changes that neither fix a bug nor add a feature |
| **perf** | Performance improvements |
| **test** | Adding or updating tests |
| **chore** | Maintenance tasks (deps, configs, CI) |

### Examples
```bash
feat(model): add factory builder support
fix(serializer): correct relation key resolution
docs: update contribution guide with Conventional Commits section
```

### Notes
- Keep summaries short (under 80 chars).
- Use **present tense** (“add” not “added”).
- Avoid capitalizing the first word after the colon.
- You can include a body or footer (e.g. to reference issues) if needed.

---

## 🔀 Pull requests

Before opening a PR:

1. Make sure all **build checks pass locally:**
   ```bash
   pnpm run build:checks
   ```
2. Review your **PR checklist** in `.github/PULL_REQUEST_TEMPLATE.md`.
3. Ensure commits follow **Conventional Commits**.
4. Squash or rebase if your branch history is noisy.

Once merged, your commits will automatically be included in the changelog via the release process.

---

## 🧪 Testing

Run all tests:
```bash
pnpm test
```

Run only a subset (by pattern):
```bash
pnpm test -- src/model
```

---

## 🎨 Code style

The repository uses:
- **ESLint** + **Prettier** for code consistency  
- **TypeScript strict mode** for type safety

Please run:
```bash
pnpm run lint
pnpm run format
```

---

## 🚀 Releases

Releases are automated with **Changesets** and follow **Semantic Versioning (semver)**.

To add a changelog entry for your PR:
```bash
pnpm changeset
```

This will guide you through writing a short description of the change and its version bump (`patch`, `minor`, or `major`).

---

## ❤️ Thank you

Your time and contributions help evolve the next generation of MirageJS ORM.  
Every issue, PR, and idea helps us refine this library — thank you for being part of it!
