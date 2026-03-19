export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const vars: Record<string, string | undefined> = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    };

    const lines: string[] = [];
    const missing: string[] = [];

    for (const [key, value] of Object.entries(vars)) {
      if (value) {
        lines.push(`  ✓ ${key} = ${value}`);
      } else {
        lines.push(`  ✗ ${key} — NOT SET`);
        missing.push(key);
      }
    }

    const status = missing.length === 0
      ? 'All environment variables are set'
      : `${missing.length} variable(s) missing`;

    console.log(`🚀 [Frontend] Boot environment check (${status})\n${lines.join('\n')}`);

    if (missing.length > 0) {
      console.warn(`⚠️  [Frontend] Missing variables: ${missing.join(', ')}`);
    }
  }
}
