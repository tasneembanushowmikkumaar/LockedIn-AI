import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get Tasks for Current Session ───
export const getSessionTasks = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(100);
  },
});

// ─── Get Active Tasks for User ───
export const getActiveTasks = query({
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

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    // Filter to active statuses
    return tasks.filter((t) =>
      ["pending", "active", "awaiting_proof"].includes(t.status)
    );
  },
});

// ─── Create Master Task (from AI chat [TASK:{...}] marker, SRS §8.5) ───
export const createMasterTask = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    description: v.string(),
    deadline_minutes: v.number(),
    difficulty: v.number(),
    proof_type: v.string(),
    punishment_hours: v.number(),
    punishment_additional: v.optional(v.string()),
    genres: v.optional(v.array(v.string())),
    cage_status: v.optional(v.string()),
    duration_minutes: v.optional(v.number()),
    verification_requirement: v.optional(v.string()),
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

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      sessionId: args.sessionId,
      title: args.title,
      description: args.description,
      task_type: "master",
      source: "ai_chat",
      status: "pending",
      proof_type: args.proof_type,
      verification_requirement: args.verification_requirement,
      deadline: now + args.deadline_minutes * 60 * 1000,
      difficulty: args.difficulty,
      duration_minutes: args.duration_minutes ?? 30,
      genres: args.genres ?? [],
      cage_status: args.cage_status ?? "caged",
      punishment_hours: args.punishment_hours,
      punishment_additional: args.punishment_additional,
    });

    // Write task_assigned event
    await ctx.db.insert("session_events", {
      sessionId: args.sessionId,
      userId: user._id,
      event_type: "task_assigned",
      payload: { taskId, title: args.title, task_type: "master" },
    });

    return taskId;
  },
});

// ─── Create Daily Task (from AI generation, SRS §8.1) ───
export const createDailyTask = mutation({
  args: {
    sessionId: v.optional(v.id("sessions")),
    title: v.string(),
    description: v.string(),
    difficulty: v.number(),
    duration_minutes: v.number(),
    genres: v.optional(v.array(v.string())),
    cage_status: v.optional(v.string()),
    verification_type: v.optional(v.string()),
    verification_requirement: v.optional(v.string()),
    punishment_hours: v.optional(v.number()),
    punishment_additional: v.optional(v.string()),
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

    // Check daily limit (5/day)
    const today = new Date().toISOString().split("T")[0];
    const dailyLog = await ctx.db
      .query("daily_task_log")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    if (dailyLog && dailyLog.count >= 5) {
      throw new Error("daily_task_limit_reached");
    }

    // Upsert daily log
    if (dailyLog) {
      await ctx.db.patch(dailyLog._id, { count: dailyLog.count + 1 });
    } else {
      await ctx.db.insert("daily_task_log", {
        userId: user._id,
        date: today,
        count: 1,
      });
    }

    const proofType =
      args.verification_type === "photo"
        ? "image"
        : args.verification_type === "self-report"
          ? null
          : args.verification_type ?? null;

    const taskId = await ctx.db.insert("tasks", {
      userId: user._id,
      sessionId: args.sessionId,
      title: args.title,
      description: args.description,
      task_type: "daily",
      source: "auto",
      status: "pending",
      proof_type: proofType ?? undefined,
      verification_requirement: args.verification_requirement,
      difficulty: args.difficulty,
      duration_minutes: args.duration_minutes,
      genres: args.genres ?? [],
      cage_status: args.cage_status ?? "caged",
      punishment_hours: args.punishment_hours ?? 0,
      punishment_additional: args.punishment_additional,
    });

    return taskId;
  },
});

// ─── Create User Task (slave-authored, SRS §8.1) ───
export const createUserTask = mutation({
  args: {
    sessionId: v.optional(v.id("sessions")),
    title: v.string(),
    description: v.optional(v.string()),
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

    return await ctx.db.insert("tasks", {
      userId: user._id,
      sessionId: args.sessionId,
      title: args.title,
      description: args.description ?? "",
      task_type: "daily",
      source: "user",
      status: "pending",
      difficulty: 1,
      duration_minutes: 30,
    });
  },
});

// ─── Create Check-in Task (SRS §8.1) ───
export const ensureCheckinTask = mutation({
  args: {
    sessionId: v.id("sessions"),
    checkin_type: v.string(), // "morning" | "night"
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

    // Check if checkin already exists for today
    const today = new Date().toISOString().split("T")[0];
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sessionId_taskType", (q) =>
        q.eq("sessionId", args.sessionId).eq("task_type", "checkin")
      )
      .take(20);

    const alreadyExists = existingTasks.some(
      (t) => t.title.includes(args.checkin_type)
    );
    if (alreadyExists) return null;

    const title =
      args.checkin_type === "morning" ? "Morning Check-in" : "Night Check-in";
    return await ctx.db.insert("tasks", {
      userId: user._id,
      sessionId: args.sessionId,
      title,
      description: `Complete your ${args.checkin_type} check-in.`,
      task_type: "checkin",
      source: "system",
      status: "pending",
      proof_type: "text",
      difficulty: 1,
      duration_minutes: 5,
    });
  },
});

// ─── Start Task ───
export const startTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (task.status !== "pending") throw new Error("Task is not pending");

    await ctx.db.patch(args.taskId, { status: "active" });
    return args.taskId;
  },
});

// ─── Complete Task (SRS §8.3, §10) ───
export const completeTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // If proof is required and not yet submitted, block completion
    if (
      task.proof_type &&
      task.status !== "awaiting_proof" &&
      task.status !== "active"
    ) {
      throw new Error("Proof required before completion");
    }

    await ctx.db.patch(args.taskId, { status: "completed" });

    // Award XP and willpower (SRS §10)
    const user = await ctx.db.get(task.userId);
    if (user) {
      const difficulty = task.difficulty ?? 3;
      const xpMap: Record<number, number> = {
        1: 5,
        2: 10,
        3: 20,
        4: 40,
        5: 80,
      };
      const xpGain = xpMap[difficulty] ?? 20;
      const willpowerGain = Math.ceil(difficulty * 3);

      await ctx.db.patch(user._id, {
        xp_total: (user.xp_total ?? 0) + xpGain,
        willpower_score: Math.min(100, (user.willpower_score ?? 50) + willpowerGain),
        compliance_streak: (user.compliance_streak ?? 0) + 1,
      });

      // Notification
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "reward",
        title: "Task Completed!",
        body: `+${xpGain} XP, +${willpowerGain} Willpower`,
        read: false,
      });
    }

    // Session event
    if (task.sessionId) {
      await ctx.db.insert("session_events", {
        sessionId: task.sessionId,
        userId: task.userId,
        event_type: "task_completed",
        payload: { taskId: args.taskId, title: task.title },
      });
    }

    return args.taskId;
  },
});

// ─── Fail Task (SRS §8.3) ───
export const failTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, { status: "failed" });

    // Deduct willpower
    const user = await ctx.db.get(task.userId);
    if (user) {
      const difficulty = task.difficulty ?? 3;
      const willpowerLoss = Math.ceil(difficulty * 2);

      await ctx.db.patch(user._id, {
        willpower_score: Math.max(0, (user.willpower_score ?? 50) - willpowerLoss),
        compliance_streak: 0, // Reset streak
      });
    }

    // Update session failed count
    if (task.sessionId) {
      const session = await ctx.db.get(task.sessionId);
      if (session) {
        await ctx.db.patch(task.sessionId, {
          total_tasks_failed: (session.total_tasks_failed ?? 0) + 1,
        });
      }

      await ctx.db.insert("session_events", {
        sessionId: task.sessionId,
        userId: task.userId,
        event_type: "task_failed",
        payload: { taskId: args.taskId, title: task.title },
      });
    }

    return args.taskId;
  },
});

// ─── Submit Proof (SRS §8.4) ───
export const submitProof = mutation({
  args: {
    taskId: v.id("tasks"),
    file_type: v.string(),
    local_storage_key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Mark task as awaiting proof
    await ctx.db.patch(args.taskId, { status: "awaiting_proof" });

    // Create proof document
    const proofId = await ctx.db.insert("proof_documents", {
      taskId: args.taskId,
      userId: task.userId,
      sessionId: task.sessionId,
      file_type: args.file_type,
      local_storage_key: args.local_storage_key,
      verification_status: "pending",
    });

    return proofId;
  },
});

// ─── Record Proof Verification Result ───
export const recordVerificationResult = mutation({
  args: {
    taskId: v.id("tasks"),
    proofId: v.id("proof_documents"),
    passed: v.boolean(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.proofId, {
      verification_status: args.passed ? "passed" : "failed",
      verified_at: Date.now(),
    });

    if (args.passed) {
      // Task completed — will be handled by completeTask mutation
      await ctx.db.patch(args.taskId, { status: "completed" });
    } else {
      // Back to awaiting_proof with rejection reason
      await ctx.db.patch(args.taskId, {
        status: "awaiting_proof",
        ai_verification_reason: args.reason ?? "Proof did not meet requirements",
      });

      // Deduct willpower for failed proof
      const user = await ctx.db.get(task.userId);
      if (user) {
        const difficulty = task.difficulty ?? 3;
        const willpowerLoss = Math.ceil(difficulty * 2);
        await ctx.db.patch(user._id, {
          willpower_score: Math.max(
            0,
            (user.willpower_score ?? 50) - willpowerLoss
          ),
        });
      }
    }

    return args.proofId;
  },
});

// ─── Internal: Create Punishment Task (called from punishment pipeline) ───
export const createPunishmentTask = internalMutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    title: v.string(),
    description: v.string(),
    requires_proof: v.boolean(),
    severity: v.number(),
  },
  handler: async (ctx, args) => {
    const deadline = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    return await ctx.db.insert("tasks", {
      userId: args.userId,
      sessionId: args.sessionId,
      title: args.title,
      description: args.description,
      task_type: "punishment",
      source: "system",
      status: "pending",
      proof_type: args.requires_proof ? "image" : undefined,
      deadline,
      difficulty: args.severity,
      duration_minutes: 30,
      punishment_hours: 0,
    });
  },
});
