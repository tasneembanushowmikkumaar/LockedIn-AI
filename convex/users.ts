import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    return user;
  },
});

// Called after Clerk sign-in to ensure user exists in Convex DB
export const storeUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
      
    if (existingUser) {
      // Update name/email/image from Clerk if changed
      await ctx.db.patch(existingUser._id, {
        name: identity.name,
        email: identity.email,
        image: identity.pictureUrl,
        updated_at: new Date().toISOString(),
      });
      return existingUser._id;
    }
    
    // Create new user
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      image: identity.pictureUrl,
      updated_at: new Date().toISOString(),
    });
  },
});

export const upsertProfile = mutation({
  args: {
    tier: v.string(),
    ai_personality: v.string(),
    hard_limits: v.array(v.string()),
    soft_limits: v.array(v.string()),
    interests: v.array(v.string()),
    initial_lock_goal_hours: v.number(),
    physical_details: v.any(),
    regimens: v.array(v.string()),
    psych_profile: v.any(),
    notification_prefs: v.object({
      frequency: v.string(),
      quiet_hours_start: v.string(),
      quiet_hours_end: v.string(),
    }),
    onboarding_completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    let user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
      
    if (!user) {
      const newUserId = await ctx.db.insert("users", {
        tokenIdentifier: identity.tokenIdentifier,
        name: identity.name,
        email: identity.email,
        ...args,
        updated_at: new Date().toISOString()
      });
      return newUserId;
    } else {
      await ctx.db.patch(user._id, { ...args, updated_at: new Date().toISOString() });
      return user._id;
    }
  },
});

export const updateProfile = mutation({
  args: {
    tier: v.optional(v.string()),
    ai_personality: v.optional(v.string()),
    hard_limits: v.optional(v.array(v.string())),
    soft_limits: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())),
    preferred_regimens: v.optional(v.array(v.string())),
    physical_details: v.optional(v.any()),
    master_preference: v.optional(v.string()),
    privacy_constraints: v.optional(v.any()),
    session_intent: v.optional(v.string()),
    communication_style: v.optional(v.any()),
    availability: v.optional(v.any()),
    safeword: v.optional(v.string()),
    psych_profile: v.optional(v.any()),
    initial_lock_goal_hours: v.optional(v.number()),
    notification_prefs: v.optional(v.object({
      frequency: v.string(),
      quiet_hours_start: v.string(),
      quiet_hours_end: v.string(),
    })),
    onboarding_completed: v.optional(v.boolean()),
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

    // Session lock check (SRS §7.6)
    const activeSession = await ctx.db
      .query("sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "extending"),
          q.eq(q.field("status"), "completing")
        )
      )
      .first();

    const updates = { ...args, updated_at: new Date().toISOString() };

    if (activeSession) {
      // If locked, only allow these 3 exception fields
      const {
        master_preference,
        session_intent,
        privacy_constraints,
        ...blockedFields
      } = updates;

      const hasBlockedChanges = Object.keys(blockedFields).length > 1; // updated_at is always included
      
      if (hasBlockedChanges) {
        throw new Error("settings_locked");
      }

      // Apply allowable updates only
      await ctx.db.patch(user._id, {
        ...(master_preference !== undefined && { master_preference }),
        ...(session_intent !== undefined && { session_intent }),
        ...(privacy_constraints !== undefined && { privacy_constraints }),
        updated_at: updates.updated_at,
      });
      return user._id;
    }

    // No active session — allow all updates
    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const getProfileStrength = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (!user) return 0;

    let score = 0;
    if (user.tier) score += 5;
    if (user.ai_personality) score += 5;
    if (user.hard_limits && user.hard_limits.length >= 1) score += 10;
    if (user.interests && user.interests.length >= 3) score += 10;
    if (user.physical_details && Object.keys(user.physical_details).length >= 3) score += 10;
    
    // psych_profile could be string or object
    const psychStr = typeof user.psych_profile === 'string' ? user.psych_profile : JSON.stringify(user.psych_profile || '');
    if (psychStr.length >= 20) score += 10;
    
    if (user.preferred_regimens && user.preferred_regimens.length >= 1) score += 10;
    if (user.master_preference && user.master_preference.length >= 20) score += 20;
    if (user.session_intent && user.session_intent.length >= 20) score += 10;
    if (user.soft_limits && user.soft_limits.length >= 1) score += 5;
    if (user.communication_style) score += 5;

    return Math.min(100, score);
  },
});

