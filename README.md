# Reader App MVP

This project is a minimal reader application built with Next.js and Supabase.
It allows saving articles by URL, reading them in a clean view, highlighting
text, and exporting highlights. Authentication uses Supabase magic links.

## Available Scripts

- `npm run dev` – start the development server
- `npm run build` – build the application

Environment variables required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` for Prisma
