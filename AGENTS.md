<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep private ERP screens under the client-only authenticated layout and mount the ERP provider only inside its shell to avoid signed-out reads.
- Use Cloud Auth for credentials, profiles for display data and protected user_roles for authorization; never duplicate passwords in public tables.
- Checkout uses a validated authenticated server function and an idempotent, row-locking database transaction; prices and stock deductions are authoritative in the database.
- Do not simulate inventory changes against persisted stock; real checkout must not be overwritten by random demo operations.
