import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// ─── Mark Expired Sessions (SRS §7.4) ───
export const markExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find active sessions past their end time
    const activeSessions = await ctx.db
      .query("sessions")
      .take(200);

    for (const session of activeSessions) {
      if (
        ["active", "extending"].includes(session.status) &&
        session.scheduled_end_time < now
      ) {
        await ctx.db.patch(session._id, { status: "completing" });
        await ctx.db.insert("session_events", {
          sessionId: session._id,
          userId: session.userId,
          event_type: "session_completing",
          payload: { triggered_by: "cron", expired_at: now },
        });
      }
    }
  },
});

// ─── Mark Overdue Tasks (SRS §7.4) ───
export const markOverdueTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find pending/active master tasks past their deadline
    const tasks = await ctx.db
      .query("tasks")
      .take(200);

    for (const task of tasks) {
      if (
        task.task_type === "master" &&
        ["pending", "active"].includes(task.status) &&
        task.deadline &&
        task.deadline < now
      ) {
        await ctx.db.patch(task._id, { status: "overdue" });

        // Trigger punishment for this overdue task
        if (task.sessionId) {
          const session = await ctx.db.get(task.sessionId);
          if (session) {
            await ctx.runMutation(internal.punishments.applyPunishment, {
              userId: task.userId,
              sessionId: task.sessionId,
              violation_type: "task_overdue",
              taskId: task._id,
            });
          }
        }
      }
    }
  },
});
