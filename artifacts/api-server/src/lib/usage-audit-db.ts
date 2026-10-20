import { db } from "@workspace/db";
import { userActivityEventsTable, type UserActivityEventType } from "@workspace/db/schema";

export async function recordUserActivityEvent(userId: number, eventType: UserActivityEventType): Promise<void> {
  try {
    await db.insert(userActivityEventsTable).values({ userId, eventType });
  } catch {
    try {
      process.emitWarning("Could not persist a user usage event", { code: "USAGE_EVENT_WRITE_FAILED" });
    } catch {
      // Activity metrics fail open; event-write issues cannot change clinical access.
    }
  }
}