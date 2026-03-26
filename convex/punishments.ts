import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const PUNISHMENT_TIER_MATRIX: Record<
  string,
  Record<string, number>
> = {
  Newbie: {
    late_task: 1,
    failed_proof: 2,
    rude_chat: 4,
    missed_checkin: 1,
    task_failed: 2,
    task_overdue: 2,
  },
  Slave: {
    late_task: 2,
    failed_proof: 4,
    rude_chat: 8,
    missed_checkin: 2,
    task_failed: 4,
    task_overdue: 4,
  },
  Hardcore: {
    late_task: 4,
    failed_proof: 8,
    rude_chat: 16,
    missed_checkin: 6,
    task_failed: 8,
    task_overdue: 8,
  },
  Extreme: {
    late_task: 8,
    failed_proof: 16,
    rude_chat: 24,
    missed_checkin: 12,
    task_failed: 16,
    task_overdue: 16,
  },
  "Total Destruction": {
    late_task: 12,
    failed_proof: 24,
    rude_chat: 48,
    missed_checkin: 24,
    task_failed: 24,
    task_overdue: 24,
  },
};

const DEFAULT_POOL = [
  { title: "Orgasm Denial Extension", description: "Your lock time has been painfully extended.", severity: 3, requires_proof: false },
  { title: "Writing Lines", description: "Write 'I am nothing but a worthless toy' 100 times.", severity: 2, requires_proof: true },
  { title: "Cold Shower", description: "Take a 5-minute freezing cold shower.", severity: 2, requires_proof: true },
  { title: "Corner Time", description: "Kneel face to the wall for 30 minutes. No moving.", severity: 1, requires_proof: false },
  { title: "Mirror Inspection", description: "Stare at your ruined state in the mirror. Send proof.", severity: 2, requires_proof: true },
  { title: "Lock Time Extension", description: "Additional denial time added directly to your timer.", severity: 4, requires_proof: false },
  { title: "Mantra Recording", description: "Record yourself begging for guidance and accepting your place.", severity: 3, requires_proof: true },
  { title: "Edging Tease", description: "Edge 5 times, no release, full ruin. Submit proof.", severity: 4, requires_proof: true },
  { title: "Humiliation Essay", description: "Write a 500-word essay detailing why you deserve this punishment.", severity: 2, requires_proof: true },
  { title: "Exposure Challenge", description: "Remain completely unclothed for the next hour wherever you are.", severity: 3, requires_proof: false },
  { title: "Severe Extension", description: "A massive block of time has been bolted onto your release date.", severity: 5, requires_proof: false },
  { title: "Ruins Only", description: "Your next permitted release is permanently downgraded to a ruined orgasm.", severity: 5, requires_proof: false },
];

// ─── Seed Default Pool (SRS §12.3) ───
export const seedDefaultPool = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    for (const item of DEFAULT_POOL) {
      const existing = await ctx.db
        .query("punishment_pool")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("title"), item.title))
        .first();

      if (!existing) {
        await ctx.db.insert("punishment_pool", {
          userId: args.userId,
          title: item.title,
          description: item.description,
          severity: item.severity,
          requires_proof: item.requires_proof,
          is_custom: false,
        });
      }
    }
  },
});

// ─── Get Pool (SRS §12.2) ───
export const getPool = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("punishment_pool")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// ─── Add Custom Entry (SRS §12.2) ───
export const addCustomEntry = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    severity: v.number(),
    requires_proof: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) throw new Error("User not found");

    const pool = await ctx.db
      .query("punishment_pool")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const customCount = pool.filter((p) => p.is_custom).length;
    if (customCount >= 20) {
      throw new Error("Max custom pool entries reached (20)");
    }

    const titleExists = pool.some(
      (p) => p.title.toLowerCase() === args.title.toLowerCase()
    );
    if (titleExists) throw new Error("Punishment title already exists");

    return await ctx.db.insert("punishment_pool", {
      userId: user._id,
      title: args.title,
      description: args.description,
      severity: args.severity,
      requires_proof: args.requires_proof,
      is_custom: true,
    });
  },
});

// ─── Delete Custom Entry (SRS §12.2) ───
export const deleteCustomEntry = mutation({
  args: { poolId: v.id("punishment_pool") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.poolId);
    if (!entry) throw new Error("Entry not found");
    if (!entry.is_custom) throw new Error("Cannot delete system entry");

    await ctx.db.delete(args.poolId);
  },
});

// ─── Apply Punishment Pipeline (SRS §9.2) ───
export const applyPunishment = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    violation_type: v.string(), // late_task | failed_proof | rude_chat | missed_checkin | task_failed | task_overdue
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const tier = user.tier ?? "Slave";
    const tierMatrix = PUNISHMENT_TIER_MATRIX[tier] ?? PUNISHMENT_TIER_MATRIX["Slave"];
    const hours = tierMatrix[args.violation_type] ?? 2;

    // 1. Extend session
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    
    // Only extend if the session is currently active
    if (!["active", "extending"].includes(session.status)) return;

    const newDuration = session.total_duration_minutes + hours * 60;
    const newEnd = session.start_time + newDuration * 60 * 1000;

    await ctx.db.patch(args.sessionId, {
      total_duration_minutes: newDuration,
      scheduled_end_time: newEnd,
      extension_count: (session.extension_count ?? 0) + 1,
      last_extended_at: Date.now(),
    });

    // 2. Spin Wheel to create punishment task
    const pool = await ctx.db
      .query("punishment_pool")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    if (pool.length > 0) {
      const violations = session.total_tasks_failed ?? 0;
      // Weighted random selection based on violations
      const weightedPool = pool.flatMap((item) => {
        let weight = 1;
        if (violations <= 2) {
          weight = 1;
        } else if (violations <= 5) {
          weight = item.severity <= 2 ? 0.5 : item.severity >= 4 ? 2 : 1;
        } else {
          weight = item.severity <= 2 ? 0 : item.severity === 5 ? 3 : 1;
        }
        const reps = Math.round(weight * 2);
        return Array(reps).fill(item);
      }).filter(Boolean);

      const selected = weightedPool[Math.floor(Math.random() * weightedPool.length)];

      const taskId = await ctx.runMutation(internal.tasks.createPunishmentTask, {
        userId: args.userId,
        sessionId: args.sessionId,
        title: selected.title,
        description: selected.description,
        requires_proof: selected.requires_proof,
        severity: selected.severity,
      });

      // 3. Write event
      await ctx.db.insert("session_events", {
        sessionId: args.sessionId,
        userId: args.userId,
        event_type: "punishment_applied",
        payload: {
          violation: args.violation_type,
          hours_added: hours,
          taskId,
          punishment_title: selected.title,
        },
      });

      // 4. Send Notification
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "punishment",
        title: "Punishment Applied",
        body: `Violation: ${args.violation_type.replace("_", " ")}. Added ${hours} hours to lock.`,
        read: false,
      });
    }
  },
});
