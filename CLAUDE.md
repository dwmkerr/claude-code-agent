# CLAUDE.md

## Development Workflow

When developing on this project, `npm run dev` or `npm run dev:otel-unsafe` is typically running with hot-reload via tsx. **Do not run `npm run build`** during development - changes are picked up automatically.

## Testing with OTEL

```bash
# Terminal 1: Run with OTEL tracing
npm run dev:otel-unsafe

# Terminal 2: Send test messages
./scripts/a2a-msg.sh "your message"
./scripts/a2a-msg.sh -c <context-id> "follow up"
```

## Debug Logging

Enable debug output with the `DEBUG` env var:

```bash
DEBUG=claude-code-agent:* npm run dev:otel-unsafe
```
