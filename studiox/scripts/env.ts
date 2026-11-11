/** Load .env for CLI scripts (Astro loads it itself for the app). */
export function loadEnv() {
  try {
    process.loadEnvFile('.env');
  } catch {
    // no .env yet: fine, PGlite is used locally
  }
}
