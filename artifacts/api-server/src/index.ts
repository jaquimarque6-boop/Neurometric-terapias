import app from "./app";

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err?.stack ?? err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3000;

console.log(`[server] starting — PORT=${port} cwd=${process.cwd()}`);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
