# CLAUDE.md - Frontend & React Guidelines

## First Step (Always)

- **Run the 'frontend-design' skill** before writing any frontend code, every session, without expection.

## Reference Images

- If a reference image is provided: replicate layout, spacing, typography, and colors precisely.
- If no reference image: design from scratch with high quality (follow guardrails below).
- Screenshot your output, compare it against the reference, fix any mismatches, and iterate until pixel-perfect.

## Local Server

- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `npm run dev` (or `node serve.mjs` depending on the setup) and ensure it runs at `http://localhost:3000` or the active Vite port.
- If the server is already running, do not launch a second instance.

## Screenshot Workflow

- **Always screenshot from localhost:** take visual captures to verify your implementation.
- After screenshotting, read the PNG output and be precise when comparing: "heading is 32px but reference shows ~24px", "card gap is too wide".
- Verify: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius.

## Output Defaults

- Framework: React (Vite-based), TypeScript, Tailwind CSS, Lucide React (for icons).
- Mobile-first responsive design.

## Brand Assets

- Always check the `brand_assets/` folder before starting the design. It may contain logos, fonts, or color swatches.
- If assets exist, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, apply those exact hex codes.

## Anti-Generic Guardrails

- **Colors:** Never use default Tailwind palette values (`indigo-500`, `blue-600`, etc. as primary branding). Always define custom, sophisticated color harmonies.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity (e.g., `shadow-[0_8px_30px_rgb(0,0,0,0.12)]`).
- **Typography:** Never use the same font for headings and body text. Pair a distinctive display font with a clean sans-serif.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise overlays to avoid sterile AI looks.
- **Animations:** Only animate `transform` and `opacity`. Never use `transition-all` or animate layout properties like `width` or `height`.
- **Interactive states:** Every clickable element must have hover, focus-visible, and active states. No dead-feeling buttons.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a subtle inner border to all card images for depth.
- **Spacing:** Use intentional, consistent spacing tokens — avoid random Tailwind spacing numbers that break rhythm.
- **Depth:** Surfaces should follow a layering system (`base -> elevated -> floating modal`) with proper backdrop filters.

## React & TypeScript Architecture

- **Strict TypeScript:** No `any` types allowed. Every function parameter, prop, and state must be explicitly typed using interfaces or types.
- **Component Structure:** Keep components modular, clean, and single-responsibility. Extract reusable logic into custom hooks (`src/hooks/`).
- **Interactive States:** Forms, modals, tabs, and dynamic elements must be fully functional with proper state management (`useState`, `useReducer`), validation, and loading indicators. No non-functional placeholders.
- **Accessibility (A11y):** Use semantic HTML tags (`nav`, `main`, `section`, `article`) and ensure proper `aria-*` attributes for interactive components.

## Hard Rules

- Do not add sections, features, or content not present in the reference.
- Do not "improve" a reference design — replicate it faithfully.
- Do not stop after a single screenshot pass; refine until visual parity is achieved.
- Do not use `transition-all`.
- Do not use default Tailwind blue/indigo as the primary color.
- Do not use `any` types in TypeScript code.
