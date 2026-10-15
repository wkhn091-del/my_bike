# Asset and library licenses

| Asset | Where | License | Notes |
|---|---|---|---|
| Secular One | `next/font/google`, self-hosted at build | SIL Open Font License 1.1 | Free for commercial use, embedding allowed. |
| Heebo | `next/font/google`, self-hosted at build | SIL Open Font License 1.1 | Same. |
| Icon paths | `src/components/ui/Icon.tsx` | ISC (Lucide) | Paths copied from Lucide; keep this notice. |
| Phone icon | `src/components/ui/Icon.tsx` | ISC (Lucide) | Drawn after Lucide's `phone`. |
| Brand icons (Instagram, Facebook, Strava, YouTube, WhatsApp) | `src/components/ui/BrandIcon.tsx` | CC0 (Simple Icons 16.35) | Paths inlined. Brand marks stay trademarks of their owners; used only to link to the official profiles. |
| GSAP, SplitText, @gsap/react | npm | GSAP Standard "No Charge" License | Free for commercial use since 2025 (Webflow), including the former Club plugins. |
| Mountain Bike GT Avalanche 2.0 | `public/hero/bike-skid-*.mp4`, `public/hero/bike-skid-poster.webp`, `public/models/mountain-bike.glb` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | By [AERO3D](https://sketchfab.com/aero3d), from [Sketchfab](https://sketchfab.com/3d-models/mountain-bike-gt-avalanche-20-e1938964243b4ce88f9db5d716bf3bcd). Used in the pre-rendered hero-video derivative. Also rendered live in the hero WebGL scene. Modified: Draco-compressed with JPEG textures; the scanned sand base was cut out of the mesh, the bike levelled (scan sat 3.1° nose-down), smooth normals baked and the unlit material made lit (`scripts/clean-bike-glb.mjs`). |
| American Road Through Tunnel | `public/hero/bike-skid-*.mp4`, `public/hero/bike-skid-poster.webp`, `public/models/road-tunnel.glb` | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | By [jimbogies](https://sketchfab.com/jimbogies), from [Sketchfab](https://sketchfab.com/3d-models/american-road-through-tunnel-2cf0e0e042ba48a1b9b70ce90c6cc6ec). Used in the pre-rendered hero-video derivative. Also rendered live in the hero WebGL scene. Modified: Draco-compressed with JPEG textures; scaled and re-lit at runtime, helper shell and portal sign hidden. |
| ogl 1.0.11 | npm, `src/motion/DistortImage.tsx` | Unlicense (public domain) | WebGL lens on desktop hover. Loaded lazily, never on touch or reduced motion. |
| Route art | `src/components/home/RouteArt.tsx` | Original work for this project | Abstract line, not traced from a map. |
| Logo (mark + wordmark) and favicon | `src/components/brand/Logo.tsx`, `src/app/icon.svg` | Original work for this project | Hills at sunset with a dotted route, in the site palette. |
| Photos | Sanity (`event.heroImage`, `yoavImages`, gallery, testimonials) | Supplied by Yoav | Every person shown needs written consent; the Studio hides gallery/testimonials without the consent checkbox. Photographer credit: ❓ pending from Yoav. |

No stock photos, no third-party illustrations, no paid fonts.
