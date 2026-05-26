# Claude Code: bim-roadmap-app

## Tech Stack
- Frontend: Vite + React (v18)
- UI: TailwindCSS + Lucide Icons
- State: Redux Toolkit
- Backend: Supabase (PostgreSQL)
- Internationalization: i18next

## Build & Dev Commands
- Dev Server: `npm run dev`
- Production Build: `npm run build`
- Linting: `npm run lint`
- Preview Build: `npm run preview`

## Project Structure
- `/src`: Main source code
- `/src/components`: UI components
- `/supabase`: SQL migration and schema files

## Coding Rules
- Use Functional Components with Hooks exclusively.
- Follow Tailwind standard classes; avoid inline styles.
- Maintain localization using `t()` from `react-i18next`.
- Keep files modular and under 300 lines where possible.
- ALL database changes must be accompanied by a `.sql` file in the root for tracking.

## Interaction Rule
- ALWAYS check if a similar Supabase migration exists before creating a new one.
- Before large refactors, use `/plan` to avoid context pollution.
