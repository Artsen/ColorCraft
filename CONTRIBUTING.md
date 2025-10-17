# Contributing to ColorCraft

Thank you for your interest in contributing to ColorCraft! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ColorCraft.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
```

## Code Style

### Python
- Follow PEP 8 guidelines
- Use type hints where appropriate
- Add docstrings to functions and classes

### TypeScript/React
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks

## Testing

Before submitting a PR, ensure:
- All existing tests pass
- New features include appropriate tests
- The application builds without errors
- No console errors or warnings

## Pull Request Guidelines

- Provide a clear description of the changes
- Reference any related issues
- Include screenshots for UI changes
- Ensure your code is well-documented
- Keep PRs focused on a single feature or fix

## Feature Requests

Feature requests are welcome! Please:
- Check if the feature has already been requested
- Provide a clear use case
- Explain how it aligns with the project goals

## Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

## Questions?

Feel free to open an issue for any questions or clarifications.

