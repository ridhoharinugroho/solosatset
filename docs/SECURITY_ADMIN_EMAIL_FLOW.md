# Security Note: Admin and Email API Flow

## Current state

The admin panel authenticates entirely in browser-side JavaScript and persists an `is authenticated` flag in `sessionStorage`. The admin credential pair is also embedded in `js/admin.js`.

This means the browser-side admin state is not a server-verifiable authentication boundary.

## Email API implication

`api/send-email.js` is a privileged serverless endpoint capable of dispatching email. The current admin UI cannot provide a trustworthy server-side proof of admin identity because its existing login state is local to the browser.

Do not add a static admin API token to frontend JavaScript: it would be exposed to every visitor.

## Required target architecture

1. Establish a server-verifiable admin identity (preferably Supabase Auth or another signed session/JWT).
2. Validate that identity inside `api/send-email.js` and `api/push-notify.js` before privileged operations.
3. Remove SMTP credentials from client-side payloads. The browser should send only a safe action/payload; SMTP configuration must remain server-side.
4. Remove hardcoded admin credentials from `js/admin.js`.
5. Add negative tests for unauthenticated and non-admin requests.

This document is intentionally advisory. It does not implement the authentication redesign.
