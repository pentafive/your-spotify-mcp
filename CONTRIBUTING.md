# Contributing to Your Spotify MCP Server

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Include clear steps to reproduce bugs
- Provide your environment details (Node.js version, OS)

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run the build to ensure it compiles (`npm run build`)
5. Commit with clear messages
6. Push to your fork
7. Open a Pull Request

### Code Style

- Use TypeScript
- Follow existing code patterns
- Add JSDoc comments for public functions
- Keep tools focused and single-purpose (MCP best practice)

### Tool Development

When adding new MCP tools:

1. Place in appropriate tier folder (`src/tools/tier1/`, etc.)
2. Use Zod for input validation
3. Write clear, LLM-friendly descriptions
4. Handle errors gracefully (error messages are shown to users)
5. Follow existing tool patterns

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add get_artist_stats tool
fix: handle empty response from Your Spotify API
docs: update README with new configuration options
```

## Development Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode (rebuild on changes)
npm run watch
```

## Questions?

Open an issue for questions or discussion.

## License

By contributing, you agree that your contributions will be licensed under Apache 2.0.
