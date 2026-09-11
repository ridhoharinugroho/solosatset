/**
 * solosatset - Supabase Database Service (Facade)
 * Central re-exporter for modular database services:
 * - supabaseStorageDB.js (Image upload, compression, deletion)
 * - supabaseListingsDB.js (Listings CRUD & realtime subscriptions)
 * - supabaseUsersDB.js (User profiles, registration, interests)
 * - supabaseSyncDB.js (Site settings, custom texts, reviews)
 * - notifications.js (Authoritative notification subsystem)
 *
 * Preserves 100% backward compatibility across all modules.
 */

export * from "./supabaseStorageDB.js";
export * from "./supabaseListingsDB.js";
export * from "./supabaseUsersDB.js";
export * from "./supabaseSyncDB.js";
export * from "./notifications.js";
