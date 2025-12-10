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
- [Release Process](#release-process)
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

### Additional Development Commands

Clean build artifacts:

```bash
npm run clean
```

Build TypeScript declarations only:

```bash
npm run build-dts
```

Build for testing environment:

```bash
npm run build-test
```

Generate API documentation:

```bash
npm run build-doc
```

Run the built test application:

```bash
npm run start
```

Check package integrity (dry run):

```bash
npm run check
```

Clear npx cache (useful for troubleshooting):

```bash
npm run clear-npx-cache
```

### Maintenance and Publishing

Check for dependency updates:

```bash
npm run check:updates
```

Generate changelog from commits:

```bash
npm run changelog
```

Fix security vulnerabilities:

```bash
npm run audit:fix
```

Publish to different npm tags:

```bash
# Pre-release versions
npm run publish:canary  # Publish with canary tag
npm run publish:beta    # Publish with beta tag

# Stable release
npm run publish:latest  # Publish stable version
```

**Note:** Publishing commands are typically only used by maintainers. The `prepublishOnly` script automatically runs the build before publishing.

### Automatic Scripts

Some scripts run automatically as pre-hooks:

- **`prebuild`**: Runs `clean && lint` before building
- **`pretest`**: Runs `build-test` before running tests
- **`prepublishOnly`**: Runs `build` before publishing to npm

These ensure code quality and consistency in the development workflow.

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

3. **Create a changeset** for your changes (if applicable):

   This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation. If your changes introduce new features, fix bugs, or include breaking changes, you need to create a changeset.

   ```bash
   npm run changeset:add
   ```

   This command will prompt you to:
   - Select the type of change: `patch`, `minor`, or `major`
   - Enter a description of the changes

   **When to create a changeset:**
   - ✅ **Patch**: Bug fixes, small improvements, documentation updates
   - ✅ **Minor**: New features that are backward compatible
   - ✅ **Major**: Breaking changes that require version bumps

   **When NOT to create a changeset:**
   - ❌ Internal refactoring with no API changes
   - ❌ Test-only changes
   - ❌ Documentation-only changes (unless significant)
   - ❌ Changes that don't affect the published package

   Changesets are stored in the `.changeset/` directory and will be used to automatically update version numbers and generate changelogs when releases are prepared.

4. Commit your changes with descriptive messages:

   ```bash
   git commit -m "feat: add new feature description"
   ```

   If you created a changeset, commit it along with your changes:

   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. Push to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request on GitHub:
   - Provide a clear description of the changes.
   - Reference any related issues.
   - Ensure CI checks pass.
   - Mention if a changeset was included and what type (patch/minor/major).

### Release Process

This project supports two release workflows: **Changesets** (recommended) and **Traditional Releases**. Here's a comparison and guide for both:

#### Changesets (Recommended)

**Why Changesets?**

- ✅ **Automated versioning**: System determines version bumps based on change types
- ✅ **Batched releases**: Multiple changes can be combined into a single release
- ✅ **Automatic changelog generation**: Professional changelogs created automatically
- ✅ **Better collaboration**: Contributors focus on describing changes, not versioning
- ✅ **Prevents version conflicts**: No manual version management issues
- ✅ **Semantic versioning compliance**: Ensures proper version increments

**How to use Changesets:**

1. **For Contributors**: Create changesets when making changes

   ```bash
   npm run changeset:add
   ```

   Select the appropriate change type and describe your changes.

2. **For Maintainers**: When ready to release

   ```bash
   # Update versions and generate changelog
   npm run changeset:version

   # Publish to npm
   npm run changeset:publish
   ```

**Changeset Types:**

- **Patch** (`0.0.1`): Bug fixes, small improvements
- **Minor** (`0.1.0`): New features (backward compatible)
- **Major** (`1.0.0`): Breaking changes

### Troubleshooting Publishing Issues

If `npm run changeset:publish` fails with a **403 Forbidden** error, it's due to npm authentication requirements:

**Error Message:** "Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages."

**Solutions:**

1. **Enable 2FA on npm** (if not already enabled):
   - Log in to [npmjs.com](https://www.npmjs.com).
   - Go to Account Settings > Two-Factor Authentication.
   - Enable 2FA and save recovery codes.

2. **Use a Granular Access Token**:
   - Log in to [npmjs.com](https://www.npmjs.com).
   - Navigate to Account Settings > Access Tokens (or visit `https://www.npmjs.com/settings/tokens` after logging in).
   - Create a new token with **Automation** or **Publish** permissions (enable bypass 2FA if available).
   - Run `npm login` and enter the token when prompted.
   - **Note**: If the tokens page returns 404, ensure you're logged in, clear browser cache, or use `npm token create` via CLI.

3. **Verify Authentication**:
   - Check login status: `npm whoami`.
   - Ensure you're logged in with the correct account.

4. **Retry Publishing**:
   - After fixing auth, run `npm run changeset:publish` again.

If issues persist, check your npm account's publishing permissions or contact npm support.

#### Traditional Releases (Legacy)

**When to use Traditional Releases:**

- ❌ **Not recommended** for regular development
- ❌ **Use only** for emergency hotfixes or when changesets are unavailable
- ❌ **Manual process** that can lead to version conflicts

**How to use Traditional Releases:**

```bash
# Patch release (0.0.1)
npm run release:patch

# Minor release (0.1.0)
npm run release:minor

# Major release (1.0.0)
npm run release:major
```

**Problems with Traditional Releases:**

- Manual version decisions can be inconsistent
- No automatic changelog generation
- Risk of version conflicts between contributors
- Doesn't scale well with multiple contributors

#### Recommendation

**Use Changesets for all regular development and releases.** The traditional release commands are kept for backward compatibility and emergency situations only.

**Workflow Summary:**

1. Contributors create changesets with their PRs
2. Maintainers batch changesets into releases using `changeset:version` and `changeset:publish`
3. Automatic version bumping and changelog generation
4. Professional release management without manual overhead

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
