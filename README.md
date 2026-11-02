# RACKET 01 Muse

Create a NEW RACKET 01 configurator as a selective synthesis of these two existing projects in this same workspace, without modifying either source:

A) a627d93c-f861-4739-9b1c-9f0704dc43eb — RACKET 01 Configurator
B) 4f3fa34c-2c1f-4fe8-a5ce-38abb5f5f519 — RACKET Guitar Configurator

This must NOT be an average, generic redesign, or unrelated third concept. Take only the strongest pieces of each source and combine them into a more resolved version.

I have inspected both. Direction for the synthesis:

FROM A, preserve the strongest editorial/brand pieces: the large RACKET wordmark/header treatment; the warmer, tactile off-white editorial atmosphere; the clearer verbal personality and microcopy such as the idea of 'Make it yours' / 'A mood, not a rule'; the strong material swatch presentation with visual samples rather than sterile controls; the sense that this is a designed RACKET artifact rather than generic configurator software; saved configurations capability; mood/reference input and recommendation concept if it can coexist cleanly; parts/exploration affordance and the useful comparison/export behaviors where appropriate.

FROM B, preserve the strongest product/configurator pieces: the much larger hero guitar/stage; direct manipulation/3D interaction if stable; the disciplined right-side configuration rail; clearer separation of Pickguard, Body finish, and Hardware; the excellent circular material thumbnails plus concise material descriptors; Front/Rear/reset camera controls; exploded-view toggle; dimensional/prototype annotations; stronger spatial hierarchy; the restrained blue selected-state; and the ability to use/export the 3D configuration where feasible. Preserve B's actual FLORA/model asset and functioning 3D implementation rather than replacing the guitar with a fake illustration.

SYNTHESIS PRINCIPLES:
- The guitar is the protagonist. Give it the visual scale and interactive presence of B.
- The interface should have A's editorial personality and B's configurator clarity.
- Avoid duplicate navigation, duplicate headings, redundant labels, or feature bloat.
- Keep RACKET's existing visual language: 1970s wit + elegant rock attitude, highbrow/lowbrow tension, less-polished London energy, warm bone neutrals, oxblood/tortoise accents where relevant, and semantic ultramarine/Klein blue for selection/system state.
- Typography should retain the elegant oversized serif display + compact utilitarian sans/mono labeling. Do not turn it into a generic SaaS dashboard.
- Material controls should feel physical/tactile. Preserve texture/pattern cues for Blue, Tortoise, Engraved, Bone, Black, Chrome/Brushed etc.
- Keep the interface spacious, editorial, and intentionally asymmetric, but configuration choices must remain immediately understandable.
- Preserve responsiveness and accessibility, keyboard focus, readable contrast, and touch usability.

DARK MODE IS REQUIRED:
Add a visible light/dark mode toggle in the main chrome. It must be a deliberately art-directed RACKET dark mode, not an automatic inversion. Use a near-black/charcoal warm ground, soft bone typography, subtle warm borders, semantic ultramarine/Klein blue still reserved for active/selected/system states, and make oxblood/tortoise/material textures remain legible. The 3D stage must feel intentional in both modes. All hover, focus, disabled, selected, border and annotation states need explicit dark equivalents. Respect prefers-color-scheme on first visit and persist the user's choice locally.

FUNCTIONAL REQUIREMENTS:
- Working configurable RACKET 01 guitar.
- Pickguard choices including Bone/Ivory, Blue/ultramarine, Tortoise, Engraved silver.
- Body finish Bone and Black.
- Hardware Chrome and Brushed.
- Large interactive stage with front/rear/reset and exploded view if supported by the model.
- Save configurations locally and expose saved configurations without overwhelming the main screen.
- Export/share image or 3D output using the best functioning source behavior available.
- Preserve useful product annotations and RACKET-specific microcopy.
- Dark/light theme toggle with persistence.

Before implementing, inspect/reuse the source projects' patterns/assets where available in the workspace. Favor working behavior over decorative imitation. Build the finished interactive prototype, not a planning document.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3b9866b8-4aa1-4880-b6b8-dd95b95254f8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
