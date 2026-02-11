Review the current code changes for quality, security, and alignment with project conventions.

1. Run `git diff` to see all current changes
2. Check against CLAUDE.md conventions and architecture rules
3. Look for:
   - Security issues (XSS, injection, hardcoded secrets)
   - Performance concerns (O(N^2) patterns, missing viewport culling)
   - Missing error handling at system boundaries
   - TypeScript strict mode violations
   - Deviation from server-authoritative architecture
4. Provide a concise report with specific file:line references
5. Suggest fixes for any issues found

$ARGUMENTS
