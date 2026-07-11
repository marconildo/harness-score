// Gate hook: denies destructive shell commands before they execute.
// Contract: JSON on stdin ({ command }), JSON on stdout ({ permission }).
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let command = '';
  try {
    command = String(JSON.parse(input || '{}').command ?? '');
  } catch {
    // Unparseable payload: allow — this gate only targets known-destructive patterns.
  }
  const destructive =
    /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\s+([/~]|\.\.)|\bgit\s+push\s+.*--force\b|\bgit\s+reset\s+--hard\b|\bdrop\s+(table|database)\b|\bnpm\s+publish\b/i;
  if (destructive.test(command)) {
    process.stdout.write(
      JSON.stringify({
        permission: 'deny',
        userMessage: `Blocked by .cursor/hooks/guard-shell.js: "${command.slice(0, 80)}" matches a destructive pattern. Run it manually if intended.`,
      }),
    );
  } else {
    process.stdout.write(JSON.stringify({ permission: 'allow' }));
  }
});
