// Load .env for local development. On Replit/Render env vars are injected
// by the platform and no .env file exists, so this is a no-op there.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on platform-provided env vars
}
