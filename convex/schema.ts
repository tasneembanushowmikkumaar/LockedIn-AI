import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users / Profiles (SRS §19.1 profiles) ───
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Profile fields
    tier: v.optional(v.string()), // Newbie | Slave | Hardcore | Extreme | Destruction
    ai_personality: v.optional(v.string()), // one of 10 personas
    hard_limits: v.optional(v.array(v.string())),
    soft_limits: v.optional(v.array(v.string())),
    interests: v.optional(v.array(v.string())), // 18 kink genres
    preferred_regimens: v.optional(v.array(v.string())), // 25 training programs
    physical_details: v.optional(v.any()), // body_type, orientation, age, etc.
    initial_lock_goal_hours: v.optional(v.number()),

    // Scoring
    willpower_score: v.optional(v.number()), // 0-100, default 50
    xp_total: v.optional(v.number()), // default 0
    compliance_streak: v.optional(v.number()), // default 0

    // Onboarding
    onboarding_completed: v.optional(v.boolean()),

    // Phase 1 profile preferences (SRS §17)
    master_preference: v.optional(v.string()),
    privacy_constraints: v.optional(v.any()), // JSON: no_public_humiliation, no_face_revealing, etc.
    session_intent: v.optional(v.string()),
    communication_style: v.optional(v.any()), // JSON: feedback_frequency, tone_preference, etc.
    availability: v.optional(v.any()), // JSON: active_hours[], timezone
    safeword: v.optional(v.string()), // default "MERCY"
    psych_profile: v.optional(v.any()), // text or structured psych answers

    // Notification preferences
    notification_prefs: v.optional(
      v.object({
        frequency: v.string(),
        quiet_hours_start: v.string(),
        quiet_hours_end: v.string(),
      })
    ),

    updated_at: v.optional(v.string()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("email", ["email"]),

  // ─── Sessions (SRS §7, §19.1) ───
  sessions: defineTable({
    userId: v.id("users"),
    status: v.string(), // idle | active | extending | completing | completed | emergency
    start_time: v.number(), // timestamp ms
    scheduled_end_time: v.number(), // timestamp ms
    total_duration_minutes: v.number(),
    session_config: v.optional(v.any()), // JSONB: tier, ai_personality, limits, regimens, duration
    extension_count: v.optional(v.number()),
    last_extended_at: v.optional(v.number()),
    care_mode_active: v.optional(v.boolean()),
    total_tasks_failed: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  // ─── Tasks (SRS §8, §19.1) ───
  tasks: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    title: v.string(),
    description: v.optional(v.string()),
    task_type: v.string(), // daily | master | punishment | checkin
    source: v.string(), // ai_chat | auto | system | user
    status: v.string(), // pending | active | completed | failed | overdue | awaiting_proof
    proof_type: v.optional(v.string()), // image | video | audio | text | null
    verification_requirement: v.optional(v.string()),
    deadline: v.optional(v.number()), // timestamp ms
    difficulty: v.optional(v.number()), // 1-5
    duration_minutes: v.optional(v.number()),
    genres: v.optional(v.array(v.string())),
    cage_status: v.optional(v.string()), // caged | uncaged | semi-caged
    punishment_hours: v.optional(v.number()),
    punishment_additional: v.optional(v.string()),
    ai_verification_reason: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_sessionId", ["sessionId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_sessionId_status", ["sessionId", "status"])
    .index("by_sessionId_taskType", ["sessionId", "task_type"]),

  // ─── Chat Messages (SRS §19.1) ───
  chat_messages: defineTable({
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    sender: v.string(), // user | ai
    content: v.string(),
    message_type: v.optional(v.string()), // normal | care_mode | punishment | safeword_detected
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),

  // ─── Session Events (SRS §19.1) ───
  session_events: defineTable({
    sessionId: v.id("sessions"),
    userId: v.id("users"),
    event_type: v.string(), // session_started, task_completed, punishment_applied, etc.
    payload: v.optional(v.any()),
  })
    .index("by_sessionId", ["sessionId"]),

  // ─── Proof Documents (SRS §19.1) ───
  proof_documents: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    sessionId: v.optional(v.id("sessions")),
    file_type: v.string(), // image | video | audio | text
    local_storage_key: v.optional(v.string()), // OPFS path reference
    verification_status: v.string(), // pending | passed | failed
    verified_at: v.optional(v.number()),
  })
    .index("by_taskId", ["taskId"])
    .index("by_sessionId", ["sessionId"]),

  // ─── Achievements (SRS §19.1) ───
  achievements: defineTable({
    userId: v.id("users"),
    achievement_id: v.string(),
    xp_awarded: v.optional(v.number()),
    awarded_at: v.optional(v.number()),
  })
    .index("by_userId", ["userId"]),

  // ─── Notifications (SRS §19.1) ───
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // reward | punishment | achievement | system
    title: v.string(),
    body: v.optional(v.string()),
    read: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"]),

  // ─── Regimens (SRS §19.1) ───
  regimens: defineTable({
    userId: v.id("users"),
    regimen_id: v.string(),
    current_day: v.optional(v.number()),
    completed_days: v.optional(v.array(v.number())),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_regimenId", ["userId", "regimen_id"]),

  // ─── Mood Check-ins (SRS §11, §19.1) ───
  mood_checkins: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    date: v.string(), // YYYY-MM-DD
    submission_depth: v.number(), // 1-10
    frustration_level: v.number(), // 1-10
    headspace_tags: v.array(v.string()), // needy, floaty, defiant, broken, etc.
    notes: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"])
    .index("by_sessionId", ["sessionId"]),

  // ─── Punishment Pool (SRS §12, §19.1) ───
  punishment_pool: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    severity: v.number(), // 1-5
    requires_proof: v.boolean(),
    is_custom: v.boolean(),
  })
    .index("by_userId", ["userId"]),

  // ─── Daily Task Log (SRS §19.1) ───
  daily_task_log: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    count: v.number(),
  })
    .index("by_userId_date", ["userId", "date"]),

  // ─── API Usage Tracking (SRS §19.1) ───
  api_usage: defineTable({
    userId: v.id("users"),
    model: v.string(),
    feature: v.string(),
    prompt_tokens: v.optional(v.number()),
    completion_tokens: v.optional(v.number()),
    total_tokens: v.optional(v.number()),
  })
    .index("by_userId", ["userId"]),
});
