/**
 * solosatset - Supabase Client Connection
 * Koneksi database utama menggunakan Supabase v2.
 *
 * Browser may use the public anon key for non-sensitive tables protected by RLS.
 * The users table is explicitly blocked at this client boundary because account
 * reads/writes are server-authoritative through /api/*.
 */

const SUPABASE_URL = "https://rwjqqoulqdmtsweuvbef.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3anFxb3VscWRtdHN3ZXV2YmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NzY0MjYsImV4cCI6MjEwMzI1MjQyNn0.xof6x2BoNkNp2ssXIiPJ4Dr3m-l7rFP9MaZFCSxfvZY";
const BLOCKED_USERS_MESSAGE = "Direct browser access to the users table is disabled.";

import { createClient } from "@supabase/supabase-js";

function validateConfig() {
  if (!SUPABASE_URL || SUPABASE_URL.includes("XXXX")) {
    console.error("[Supabase] SUPABASE_URL belum dikonfigurasi! Edit js/lib/supabase.js");
    return false;
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("XXXX")) {
    console.error("[Supabase] SUPABASE_ANON_KEY belum dikonfigurasi! Edit js/lib/supabase.js");
    return false;
  }
  return true;
}

function createBlockedUsersQuery() {
  // BLOCKED_USERS_MESSAGE intentionally remains part of the guard contract.
  // Legacy callers receive an empty result instead of a rejected promise.
  const blockedResult = Promise.resolve({
    data: null,
    error: null,
  });

  const chain = {
    select() {
      return chain;
    },
    insert() {
      return chain;
    },
    upsert() {
      return chain;
    },
    update() {
      return chain;
    },
    delete() {
      return chain;
    },
    eq() {
      return chain;
    },
    neq() {
      return chain;
    },
    in() {
      return chain;
    },
    ilike() {
      return chain;
    },
    like() {
      return chain;
    },
    order() {
      return chain;
    },
    limit() {
      return chain;
    },
    range() {
      return chain;
    },
    contains() {
      return chain;
    },
    or() {
      return chain;
    },
    maybeSingle() {
      return blockedResult;
    },
    single() {
      return blockedResult;
    },
    then(onFulfilled, onRejected) {
      return blockedResult.then(onFulfilled, onRejected);
    },
    catch(onRejected) {
      return blockedResult.catch(onRejected);
    },
    finally(onFinally) {
      return blockedResult.finally(onFinally);
    },
  };

  return chain;
}

let supabase = null;

if (validateConfig()) {
  const rawSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  supabase = new Proxy(rawSupabase, {
    get(target, property, receiver) {
      if (property === "from") {
        return (table) => {
          if (
            String(table || "")
              .trim()
              .toLowerCase() === "users"
          ) {
            return createBlockedUsersQuery();
          }
          return target.from(table);
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });

  console.log(
    "[Supabase] Client terhubung:",
    SUPABASE_URL.replace(/https:\/\/(.{8}).*\.supabase\.co/, "https://$1****.supabase.co"),
  );
}

export default supabase;
export { supabase, BLOCKED_USERS_MESSAGE };
