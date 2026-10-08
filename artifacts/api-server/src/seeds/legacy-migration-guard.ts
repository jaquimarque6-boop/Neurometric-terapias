export function assertLegacyMigrationEnabled(environmentVariable: string): void {
  if (process.env[environmentVariable] !== "true") {
    throw new Error(
      `Legacy migration is disabled. Set ${environmentVariable}=true to explicitly enable a manual run.`,
    );
  }
}
