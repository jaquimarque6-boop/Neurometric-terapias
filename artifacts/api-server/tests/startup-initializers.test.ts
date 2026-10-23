import assert from "node:assert/strict";
import test from "node:test";
import { runStartupInitializers, type StartupInitializers } from "../src/startup-initializers";

function createInitializers(calls: string[]): StartupInitializers {
  const record = (name: string) => async () => {
    calls.push(name);
  };

  return {
    seedAdminIfNeeded: record("default-admin"),
    ensureJaquiAdmin: record("named-admin"),
    ensureTempAdmin: record("temporary-admin"),
    seedGoalLibraryIfNeeded: record("goal-library"),
  };
}

test("production startup does not run any account seed", () => {
  const calls: string[] = [];

  runStartupInitializers("production", createInitializers(calls));

  assert.deepEqual(calls, ["goal-library"]);
});

test("development retains local administrator and goal-library initialization", () => {
  const calls: string[] = [];

  runStartupInitializers("development", createInitializers(calls));

  assert.deepEqual(calls, [
    "default-admin",
    "named-admin",
    "temporary-admin",
    "goal-library",
  ]);
});

test("test, staging, and unset environments fail closed for account seeds", () => {
  for (const nodeEnv of ["test", "staging", undefined]) {
    const calls: string[] = [];

    runStartupInitializers(nodeEnv, createInitializers(calls));

    assert.deepEqual(calls, nodeEnv === "test" ? [] : ["goal-library"]);
  }
});
