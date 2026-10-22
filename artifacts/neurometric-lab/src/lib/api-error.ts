export async function responseErrorMessage(response: Response, fallback: string): Promise<string> {
  const responseText = await response.text();
  try {
    const payload: unknown = JSON.parse(responseText);
    if (payload && typeof payload === "object") {
      const error = "error" in payload ? payload.error : undefined;
      const message = "message" in payload ? payload.message : undefined;
      if (typeof error === "string" && error.trim()) return error;
      if (typeof message === "string" && message.trim()) return message;
    }
  } catch {
    // Non-JSON responses (for example Express's HTML 500 page) still retain
    // their HTTP status below, without exposing response HTML to the user.
  }
  return `${fallback} (HTTP ${response.status})`;
}
