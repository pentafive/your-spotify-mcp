# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email: pentafive@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial assessment:** Within 1 week
- **Fix timeline:** Depends on severity

## Security Considerations

### API Tokens

- Never commit tokens to version control
- Use environment variables for all credentials
- Tokens are stored locally only (STDIO transport)

### Data Handling

- This MCP server runs locally on your machine
- No data is sent to third parties
- All API calls go directly to:
  - Your self-hosted Your Spotify instance
  - Official Spotify API (api.spotify.com)

### Network Security

- MCP uses STDIO transport (no network exposure)
- HTTPS for all external API calls
- No listening ports opened

## Best Practices for Users

1. Keep your Your Spotify API token private
2. Use Spotify OAuth tokens with minimal required scopes
3. Don't share your `claude_desktop_config.json` publicly
4. Regularly rotate API tokens
