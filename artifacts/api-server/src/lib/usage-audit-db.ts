import { db } from "@workspace/db";
import { userActivityEventsTable, type UserActivityEventType } from "@workspace/db/schema";
import { dispatchUsageEventWrite } from "./usage-audit";

export function recordUserActivityEvent(userId: number, eventType: UserActivityEventType): void {
  dispatchUsageEventWrite(
    () => db.insert(userActivityEventsTable).values({ userId, eventType }),
    () => process.emitWarning("Could not persist a user usage event", { code: "USAGE_EVENT_WRITE_FAILED" }),
  );
}