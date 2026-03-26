import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Submit Mood Check-in (SRS §11.2) ───
export const submitCheckin = mutation({
  args: {
    sessionId: v.id("sessions"),
    submission_depth: v.number(),
    frustration_level: v.number(),
    headspace_tags: v.array(v.string()),
    notes: v.optional(v.string()),
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

    const today = new Date().toISOString().split("T")[0];

    // Upsert on (userId, date)
    const existing = await ctx.db
      .query("mood_checkins")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    let checkinId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        submission_depth: args.submission_depth,
        frustration_level: args.frustration_level,
        headspace_tags: args.headspace_tags,
        notes: args.notes,
      });
      checkinId = existing._id;
    } else {
      checkinId = await ctx.db.insert("mood_checkins", {
        userId: user._id,
        sessionId: args.sessionId,
        date: today,
        submission_depth: args.submission_depth,
        frustration_level: args.frustration_level,
        headspace_tags: args.headspace_tags,
        notes: args.notes,
      });
    }

    // Care Mode Trigger (SRS §11.2)
    // "frustrationLevel >= 8 AND tags include broken or desperate"
    const triggersCareMode =
      args.frustration_level >= 8 &&
      (args.headspace_tags.includes("broken") ||
        args.headspace_tags.includes("desperate"));

    if (triggersCareMode) {
      const session = await ctx.db.get(args.sessionId);
      if (session && !session.care_mode_active) {
        await ctx.db.patch(args.sessionId, { care_mode_active: true });

        await ctx.db.insert("session_events", {
          sessionId: args.sessionId,
          userId: user._id,
          event_type: "care_mode_triggered",
          payload: { reason: "mood_checkin", frustration_level: args.frustration_level },
        });
      }
    }

    return checkinId;
  },
});

// ─── Get Latest Check-in for AI Context (SRS §11.4) ───
export const getLatestCheckin = query({
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

    const checkins = await ctx.db
      .query("mood_checkins")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    return checkins.length > 0 ? checkins[0] : null;
  },
});

export const getSessionCheckins = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mood_checkins")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});
