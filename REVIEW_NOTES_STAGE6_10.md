# Stage 6–10 Review Notes

Temporary review notes for validating the modal refactor and Supabase dependency cleanup before merge.

- Validate async modal partial loading and duplicate initialization.
- Validate a single close-modal mechanism for dynamically injected modals.
- Validate no production code depends on the removed CDN global `window.supabase`.
- Validate malformed local/session storage paths.

Do not merge until these checks pass.