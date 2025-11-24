# Contributing to ResLib

Thank you for your interest in contributing to ResLib! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. Please be respectful and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Fork and Clone

1. Fork the repository on GitHub.
2. Clone your fork locally (replace `<your-github-username>` with your actual GitHub username):
   ```bash
   git clone https://github.com/<your-github-username>/reslib.git
   cd reslib
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/boris-fouomene/reslib.git
   ```

## Development Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up Git hooks (for pre-commit checks):

   ```bash
   npm run prepare
   ```

## Development Workflow

### Building the Project

To build the library:

```bash
npm run build
```

For development with watch mode:

```bash
npm run dev
```

### Running Tests

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

### Linting and Formatting

Check for linting issues:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code.
- Ensure type safety and avoid `any` types where possible.
- Use interfaces over types for object shapes.

### Code Style

- Follow the ESLint configuration defined in `.eslintrc.js`.
- Use Prettier for consistent formatting.
- Commit messages should follow conventional commit format (e.g., `feat: add new feature`, `fix: resolve bug`).

### File Structure

- Place source code in the `src/` directory.
- Follow the existing module structure (auth, countries, etc.).
- Export public APIs through index files.

## Testing

- Write unit tests for new features and bug fixes.
- Aim for good test coverage.
- Use Jest as the testing framework.
- Place test files alongside source files with `.spec.ts` or `.test.ts` extension.

## Submitting Changes

1. Create a feature branch from `master`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, ensuring tests pass and code is linted/formatted.
3. Commit your changes with descriptive messages:

   ```bash
   git commit -m "feat: add new feature description"
   ```

4. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request on GitHub:
   - Provide a clear description of the changes.
   - Reference any related issues.
   - Ensure CI checks pass.

## Reporting Issues

- Use GitHub Issues to report bugs or request features.
- Provide detailed information including steps to reproduce, expected behavior, and environment details.
- Check existing issues before creating new ones.

## Additional Resources

- [README.md](README.md) - Project overview and usage
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [Package.json](package.json) - Scripts and dependencies

We appreciate your contributions to make ResLib better!`</content>`
`<parameter name="filePath">`d:\Projets\VSCODE\reslib\CONTRIBUTING.md
