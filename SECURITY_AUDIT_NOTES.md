# Security Audit Notes

- Runtime database schema mutation removed in PR #3.
- Push VAPID secret fallback isolated in PR #5; key rotation still required.
- Storage service-role fallback isolated in PR #6.
- Email dispatcher credential fallback and caller-supplied SMTP config remain under review.
- Password reset currently uses the legacy custom `users.password` model and requires a separate authentication redesign.
