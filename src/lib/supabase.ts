/**
 * solosatset - Supabase Client Connection (TypeScript)
 * Main database connection using Supabase v2 client.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://rwjqqoulqdmtsweuvbef.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3anFxb3VscWRtdHN3ZXV2YmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2NzY0MjYsImV4cCI6MjEwMzI1MjQyNn0.xof6x2BoNkNp2ssXIiPJ4Dr3m-l7rFP9MaZFCSxfvZY";

export const BLOCKED_USERS_MESSAGE = "Direct browser access to the users table is disabled.";

function createBlockedUsersQuery() {
  const blockedResult = Promise.resolve({
    data: null,
    error: null,
  });

  const chain: any = {
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
    then(onFulfilled: any, onRejected: any) {
      return blockedResult.then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return blockedResult.catch(onRejected);
    },
    finally(onFinally: any) {
      return blockedResult.finally(onFinally);
    },
  };

  return chain;
}

let supabaseClient: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  const rawSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  supabaseClient = new Proxy(rawSupabase, {
    get(target, property, receiver) {
      if (property === "from") {
        return (table: string) => {
          if (String(table || "").trim().toLowerCase() === "users") {
            return createBlockedUsersQuery();
          }
          return target.from(table);
        };
      }
      return Reflect.get(target, property, receiver);
    },
  }) as SupabaseClient;
}

export const supabase = supabaseClient as SupabaseClient;
export default supabase;
