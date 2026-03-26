import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Start Regimen (SRS §4.2) ───
export const startRegimen = mutation({
  args: { regimen_id: v.string() },
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

    const existing = await ctx.db
      .query("regimens")
      .withIndex("by_userId_regimenId", (q) =>
        q.eq("userId", user._id).eq("regimen_id", args.regimen_id)
      )
      .unique();

    if (existing) throw new Error(`Already enrolled in regimen: ${args.regimen_id}`);

    return await ctx.db.insert("regimens", {
      userId: user._id,
      regimen_id: args.regimen_id,
      current_day: 1,
      completed_days: [],
    });
  },
});

// ─── Get User's Active Regimens ───
export const getUserRegimens = query({
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
      .query("regimens")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// ─── Complete Regimen Day (AI-gated completion, SRS §21.6) ───
export const completeDay = internalMutation({
  args: {
    userId: v.id("users"),
    regimen_id: v.string(),
    day: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const regimen = await ctx.db
      .query("regimens")
      .withIndex("by_userId_regimenId", (q) =>
        q.eq("userId", user._id).eq("regimen_id", args.regimen_id)
      )
      .unique();

    if (!regimen) throw new Error("Regimen not found");

    if (regimen.current_day !== args.day) {
      throw new Error("Can only complete current day");
    }

    const completed = [...(regimen.completed_days ?? []), args.day];

    await ctx.db.patch(regimen._id, {
      completed_days: completed,
      current_day: args.day + 1,
    });

    return regimen._id;
  },
});
