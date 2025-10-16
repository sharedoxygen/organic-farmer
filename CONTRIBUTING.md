# Contributing to OFMS

First off, thank you for considering contributing to OFMS! It's people like you that make OFMS such a great tool for organic farmers worldwide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how it would be used**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Documentation improvements

### Pull Requests

- Fill in the required template
- Follow the coding standards
- Include tests when adding features
- Update documentation as needed
- End all files with a newline

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

### Setup Steps

1. **Fork the repository**

```bash
# Click the "Fork" button on GitHub
```

2. **Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/ofms.git
cd ofms
```

3. **Add upstream remote**

```bash
git remote add upstream https://github.com/ofms/ofms.git
```

4. **Install dependencies**

```bash
npm install
```

5. **Set up environment**

```bash
cp .env.example .env
# Edit .env with your database credentials
```

6. **Set up database**

```bash
npx prisma db push
npx prisma db seed
```

7. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:3005`

---

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards
- Add tests for new features
- Update documentation

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test

# Build to verify
npm run build
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "Add: brief description of changes"
```

See [Commit Messages](#commit-messages) for guidelines.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Fill in the PR template
- Link related issues
- Request review

### 7. Address Review Feedback

- Make requested changes
- Push updates to the same branch
- Respond to comments

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable names

### React/Next.js

- Use functional components
- Use hooks appropriately
- Keep components small and focused
- Extract reusable logic into custom hooks

### File Structure

```
src/
├── app/ # Next.js app directory
├── components/ # Reusable components
├── lib/ # Utility functions
├── types/ # TypeScript types
└── styles/ # Global styles
```

### Naming Conventions

- **Components**: PascalCase (`UserCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **CSS Modules**: camelCase (`userCard.module.css`)

### Code Style

```typescript
// ✅ Good
interface User {
 id: string;
 name: string;
 email: string;
}

function getUserById(id: string): User | null {
 // Implementation
}

// ❌ Bad
interface user {
 ID: string;
 Name: string;
 Email: string;
}

function get_user(id: any) {
 // Implementation
}
```

---

## 📝 Commit Messages

### Format

```
<type>: <subject>

<body>

<footer>
```

### Types

- **Add**: New feature
- **Fix**: Bug fix
- **Update**: Update existing feature
- **Remove**: Remove code or files
- **Refactor**: Code refactoring
- **Docs**: Documentation changes
- **Style**: Code style changes
- **Test**: Add or update tests
- **Chore**: Build process or tooling

### Examples

```bash
# Good
Add: user authentication with JWT
Fix: dashboard loading spinner not showing
Update: improve error handling in API routes
Docs: add installation guide

# Bad
fixed stuff
updated code
changes
```

### Guidelines

- Use imperative mood ("Add" not "Added")
- Keep subject line under 50 characters
- Capitalize first letter
- No period at the end
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain what and why, not how

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

```typescript
// Example test
import { render, screen } from '@testing/library/react';
import UserCard from './UserCard';

describe('UserCard', () => {
 it('renders user name', () => {
 render(<UserCard name="John Doe" />);
 expect(screen.getByText('John Doe')).toBeInTheDocument();
 });
});
```

### Test Coverage

- Aim for 80%+ coverage
- Test critical paths
- Test edge cases
- Test error handling

---

## 📚 Documentation

### Code Comments

```typescript
// ✅ Good - Explains why
// Use exponential backoff to avoid overwhelming the API
const delay = Math.pow(2, retryCount) * 1000;

// ❌ Bad - Explains what (obvious from code)
// Set delay to 2 to the power of retryCount times 1000
const delay = Math.pow(2, retryCount) * 1000;
```

### JSDoc

```typescript
/**
 * Fetches user data from the API
 * @param userId - The unique identifier for the user
 * @returns Promise resolving to user data or null if not found
 * @throws {ApiError} When the API request fails
 */
async function fetchUser(userId: string): Promise<User | null> {
 // Implementation
}
```

---

## 🏗️ Project Structure

```
ofms/
├── src/
│ ├── app/ # Next.js pages and API routes
│ ├── components/ # React components
│ ├── lib/ # Utility functions
│ ├── types/ # TypeScript types
│ └── styles/ # Global styles
├── prisma/ # Database schema and migrations
├── public/ # Static assets
├── docs/ # Documentation
├── scripts/ # Build and utility scripts
└── tests/ # Test files
```

---

## 🔍 Code Review

### What We Look For

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it clean and maintainable?
- **Tests**: Are there adequate tests?
- **Documentation**: Is it well documented?
- **Performance**: Is it efficient?
- **Security**: Are there security concerns?

### Review Process

1. Automated checks run (linting, tests, build)
2. Maintainers review the code
3. Feedback is provided
4. Changes are requested if needed
5. Once approved, PR is merged

---

## 🎯 Best Practices

### Performance

- Minimize bundle size
- Optimize images
- Use lazy loading
- Implement caching

### Security

- Validate all inputs
- Sanitize user data
- Use environment variables for secrets
- Follow OWASP guidelines

### Accessibility

- Use semantic HTML
- Provide alt text for images
- Ensure keyboard navigation
- Test with screen readers

---

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/ofms)
- **GitHub Discussions**: Ask questions
- **Email**: dev@ofms.com

---

## 🙏 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Annual contributor report

---

## 📄 License

By contributing to OFMS, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OFMS! 🌱
