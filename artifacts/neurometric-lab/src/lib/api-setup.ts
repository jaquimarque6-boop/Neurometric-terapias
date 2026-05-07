const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

if (apiBase) {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return _fetch(`${apiBase}${input}`, init);
    }
    return _fetch(input, init);
  };
}
