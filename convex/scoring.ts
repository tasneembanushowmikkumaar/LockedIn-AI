import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── XP & Willpower Awards (SRS §10) ───
// Most XP and willpower is handled inside `convex/tasks.ts` upon task completion/failure. 
// Streak checking and achievements are handled here.

export const checkAchievements = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const achievements = await ctx.db
      .query("achievements")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const unlockedIds = new Set(achievements.map((a) => a.achievement_id));
    const newAchievements = [];

    // Example milestone: 100 XP
    if (!unlockedIds.has("xp_100") && (user.xp_total ?? 0) >= 100) {
      newAchievements.push({ id: "xp_100", xp: 50, title: "100 XP Milestone" });
    }

    // Example milestone: 7-day streak
    if (!unlockedIds.has("streak_7") && (user.compliance_streak ?? 0) >= 7) {
      newAchievements.push({ id: "streak_7", xp: 100, title: "7-Day Streak" });
    }

    for (const badge of newAchievements) {
      await ctx.db.insert("achievements", {
        userId: args.userId,
        achievement_id: badge.id,
        xp_awarded: badge.xp,
        awarded_at: Date.now(),
      });

      // Award the bonus XP
      await ctx.db.patch(args.userId, {
        xp_total: (user.xp_total ?? 0) + badge.xp,
      });

      // Notify
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "achievement",
        title: "Achievement Unlocked!",
        body: `You unlocked ${badge.title}. +${badge.xp} XP`,
        read: false,
      });
    }
  },
});

export const getAchievements = query({
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
      .query("achievements")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});
