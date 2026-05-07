import app from "./app";
import path from "path";

console.log("[server] index.cjs starting — cwd:", process.cwd());
console.log("[server] __filename:", typeof __filename !== "undefined" ? __filename : "(ESM — no __filename)");

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
