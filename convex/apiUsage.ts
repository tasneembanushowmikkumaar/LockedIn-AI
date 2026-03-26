import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const trackUsage = mutation({
  args: {
    model: v.string(),
    feature: v.string(),
    prompt_tokens: v.number(),
    completion_tokens: v.number(),
    total_tokens: v.number(),
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

    return await ctx.db.insert("api_usage", {
      userId: user._id,
      model: args.model,
      feature: args.feature,
      prompt_tokens: args.prompt_tokens,
      completion_tokens: args.completion_tokens,
      total_tokens: args.total_tokens,
    });
  },
});

export const getUsage = query({
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
      .query("api_usage")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
  },
});
