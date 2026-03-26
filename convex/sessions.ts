import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── Get Active Session ───
export const getActiveSession = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .first();

    // Also check extending/completing statuses
    if (session) return session;

    const extending = await ctx.db
      .query("sessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", "extending")
      )
      .first();
    if (extending) return extending;

    const completing = await ctx.db
      .query("sessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", "completing")
      )
      .first();
    return completing;
  },
});

// ─── Get Session by ID ───
export const getSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// ─── Get User's Session History ───
export const getUserSessions = query({
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
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// ─── Start Session (SRS §7.2) ───
export const startSession = mutation({
  args: {
    session_config: v.any(), // { tier, ai_personality, hard_limits, soft_limits, regimens, desired_duration_minutes }
    total_duration_minutes: v.number(),
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

    // Check for existing active session (409 equivalent)
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", "active")
      )
      .first();
    if (existing) throw new Error("active_session_exists");

    const extendingCheck = await ctx.db
      .query("sessions")
      .withIndex("by_userId_status", (q) =>
        q.eq("userId", user._id).eq("status", "extending")
      )
      .first();
    if (extendingCheck) throw new Error("active_session_exists");

    const now = Date.now();
    const sessionId = await ctx.db.insert("sessions", {
      userId: user._id,
      status: "active",
      start_time: now,
      scheduled_end_time: now + args.total_duration_minutes * 60 * 1000,
      total_duration_minutes: args.total_duration_minutes,
      session_config: args.session_config,
      extension_count: 0,
      care_mode_active: false,
      total_tasks_failed: 0,
    });

    // Write session_started event
    await ctx.db.insert("session_events", {
      sessionId,
      userId: user._id,
      event_type: "session_started",
      payload: { config: args.session_config },
    });

    // Seed default punishment pool (idempotent)
    await ctx.runMutation(internal.punishments.seedDefaultPool, {
      userId: user._id,
    });

    return sessionId;
  },
});

// ─── Extend Session (SRS §7.3) ───
export const extendSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    additional_minutes: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!["active", "extending"].includes(session.status)) {
      throw new Error("Session is not active");
    }

    const newDuration = session.total_duration_minutes + args.additional_minutes;
    const newEnd = session.start_time + newDuration * 60 * 1000;

    await ctx.db.patch(args.sessionId, {
      total_duration_minutes: newDuration,
      scheduled_end_time: newEnd,
      extension_count: (session.extension_count ?? 0) + 1,
      last_extended_at: Date.now(),
    });

    await ctx.db.insert("session_events", {
      sessionId: args.sessionId,
      userId: session.userId,
      event_type: "timer_extended",
      payload: {
        additional_minutes: args.additional_minutes,
        reason: args.reason ?? "punishment",
        new_end_time: newEnd,
      },
    });

    return { newEnd, newDuration };
  },
});

// ─── Complete Session (SRS §7.5) ───
export const completeSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, { status: "completed" });

    await ctx.db.insert("session_events", {
      sessionId: args.sessionId,
      userId: session.userId,
      event_type: "session_completed",
    });

    return args.sessionId;
  },
});

// ─── Emergency Release (SRS §5.4) ───
export const emergencyRelease = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, { status: "emergency" });

    await ctx.db.insert("session_events", {
      sessionId: args.sessionId,
      userId: session.userId,
      event_type: "session_emergency",
    });

    return args.sessionId;
  },
});

// ─── Purge Session Data (SRS §7.5) ───
export const purgeSessionData = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Delete chat messages for session
    const messages = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(500);
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    // Delete proof documents for session
    const proofs = await ctx.db
      .query("proof_documents")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(500);
    for (const proof of proofs) {
      await ctx.db.delete(proof._id);
    }

    // Delete session events
    const events = await ctx.db
      .query("session_events")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .take(500);
    for (const event of events) {
      await ctx.db.delete(event._id);
    }

    return { purged: true };
  },
});

// ─── Internal: Mark session as completing (called by cron) ───
export const markSessionCompleting = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;
    if (!["active", "extending"].includes(session.status)) return;

    await ctx.db.patch(args.sessionId, { status: "completing" });

    await ctx.db.insert("session_events", {
      sessionId: args.sessionId,
      userId: session.userId,
      event_type: "session_completing",
      payload: { triggered_by: "cron" },
    });
  },
});
