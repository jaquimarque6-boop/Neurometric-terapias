type AsyncInitializer = () => Promise<void>;

export type StartupInitializers = {
  seedAdminIfNeeded: AsyncInitializer;
  ensureJaquiAdmin: AsyncInitializer;
  ensureTempAdmin: AsyncInitializer;
  seedGoalLibraryIfNeeded: AsyncInitializer;
};

function start(initializer: AsyncInitializer): void {
  initializer().catch(console.error);
}

export function runStartupInitializers(
  nodeEnv: string | undefined,
  initializers: StartupInitializers,
): void {
  if (nodeEnv === "test") return;

  // Only explicit development runs may create default administrator accounts.
  // This is fail-closed for production, staging, and unset NODE_ENV.
  if (nodeEnv === "development") {
    start(initializers.seedAdminIfNeeded);
    start(initializers.ensureJaquiAdmin);
    start(initializers.ensureTempAdmin);
  }

  // The catalog initializer is independent from account creation and remains
  // enabled outside tests; it only inserts missing goal-library IDs.
  start(initializers.seedGoalLibraryIfNeeded);
}
