import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

// ─── Session Auto-Expiry + Task Overdue Cron (SRS §7.4) ───
// Runs every minute: marks expired sessions as 'completing',
// marks overdue master tasks as 'overdue' and triggers punishment
export const processExpiredSessions = internalAction({
  args: {},
  handler: async (ctx) => {
    // Mark expired sessions
    await ctx.runMutation(internal.cronHelpers.markExpiredSessions);
    // Mark overdue tasks and trigger punishments
    await ctx.runMutation(internal.cronHelpers.markOverdueTasks);
  },
});

const crons = cronJobs();

crons.interval(
  "process expired sessions and overdue tasks",
  { minutes: 1 },
  internal.crons.processExpiredSessions,
  {}
);

export default crons;
