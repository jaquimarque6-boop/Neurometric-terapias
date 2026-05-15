import app from "./app";

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err?.stack ?? err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;

// BUILD_TIMESTAMP is replaced at build time by esbuild define.
// In dev (tsx), process.env.BUILD_TIMESTAMP is undefined → shows "dev".
const buildTs = process.env.BUILD_TIMESTAMP ?? "dev";

console.log("=".repeat(60));
console.log(`[cors] dynamic origin matching active`);
console.log(`[cors] built: ${buildTs}`);
console.log(`[server] PORT=${port} NODE_ENV=${process.env.NODE_ENV ?? "unset"}`);
console.log("=".repeat(60));

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
