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

## RACKET architecture
- Keep the two source project snapshots read-only; reused renderer and materials are independent copies in this project.
- Mount the interactive workbench on the client-only index route to keep Three.js and browser persistence out of SSR.
- Keep all UI appearance and theme states in the global semantic design system; render-material palettes live in the dedicated material module.
- Local configurations and theme choice use versioned browser storage because the requested prototype explicitly requires local persistence.
- Export the same displayed configurable geometry, not a reference model, so downloaded GLBs reflect the selected materials and exploded state.
- B's configurable model is a dimensional approximation; do not label it FLORA. The original FLORA asset migration is blocked by source-origin access denial.
