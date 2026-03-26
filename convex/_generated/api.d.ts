/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as apiUsage from "../apiUsage.js";
import type * as cronHelpers from "../cronHelpers.js";
import type * as crons from "../crons.js";
import type * as moodCheckins from "../moodCheckins.js";
import type * as notifications from "../notifications.js";
import type * as punishments from "../punishments.js";
import type * as regimens from "../regimens.js";
import type * as scoring from "../scoring.js";
import type * as sessions from "../sessions.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  apiUsage: typeof apiUsage;
  cronHelpers: typeof cronHelpers;
  crons: typeof crons;
  moodCheckins: typeof moodCheckins;
  notifications: typeof notifications;
  punishments: typeof punishments;
  regimens: typeof regimens;
  scoring: typeof scoring;
  sessions: typeof sessions;
  tasks: typeof tasks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
