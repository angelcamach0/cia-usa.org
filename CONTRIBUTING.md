# Contributing

Thanks for helping improve this project. This repo is meant to be easy to extend and safe to run.

## Development setup

```sh
npm install
npm run dev
```

## Deployment

```sh
npm run deploy
```

## Code standards

- Use camelCase for variables and functions.
- Use lowercase file names with dashes or underscores.
- Use semicolons at the end of statements.
- Use at least 2 spaces for indentation; no tabs.
- Use `"use strict"` at the start of scripts when you want strict parsing.
- Avoid hardcoding secrets; use Cloudflare Worker environment variables.

## Engineering principles

- DRY: extract repeated logic into reusable helpers.
- KISS: keep logic simple and readable.
- YAGNI: avoid speculative features.
- SOLID: keep responsibilities focused and extend via composition when possible.

## Performance guidance

- Profile before optimizing to find true bottlenecks.
- Keep the render loop lightweight and avoid unnecessary DOM work.
- Prefer efficient data structures for any new large collections.

## Pull requests

- Keep changes focused and scoped.
- Update docs when behavior changes.
- Include screenshots or screen recordings for visual changes.
