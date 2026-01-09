# CLAUDE.md

## Development Workflow

When developing on this project, `npm run dev` is typically running with hot-reload via tsx. **Do not run `npm run build`** during development - changes are picked up automatically.

## Testing

```bash
npm test
```

## Debug Logging

Enable debug output with the `DEBUG` env var:

```bash
DEBUG=claude-code-agent:* npm run dev
```
