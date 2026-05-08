import app from "./app";

console.log("[server] index.cjs starting — cwd:", process.cwd());
console.log("[server] __filename:", typeof __filename !== "undefined" ? __filename : "(ESM — no __filename)");

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
