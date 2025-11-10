# CarePlanner+

A comprehensive care home management system built with React, Vite, TypeScript, Tailwind CSS, and Supabase.

## Features

- Secure authentication with Supabase Auth
- Dashboard overview
- Service users management
- Staff management
- Rota scheduling
- Medication Administration Record (MAR)
- Daily notes
- Incident reporting
- Compliance tracking
- Document management

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## How to Run

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Supabase (Auth & Database)
