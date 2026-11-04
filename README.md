# DoodhWala

A React Native / Expo milk-delivery operations app for morning attendance, customer management, monthly history, customer bills and Supabase cloud storage.

## Current implementation status

This repository contains the initial Expo application foundation:
- Email/password administrator sign-in using Supabase Auth.
- Supabase client with persistent native sessions.
- Dashboard and navigation for delivery, customers, monthly history and bills.
- Morning attendance marking.
- Smooth button press feedback and a compact receipt preview.
- Environment-based Supabase configuration (no credentials committed).

Some screens are foundations and are not yet production-complete. In particular, product-level quantity entry, full date-wise monthly queries, bill persistence/PDF or PNG sharing, offline queue/retry, automatic daily upload, company settlement reports, customer CRUD, and the full 75-customer import remain to be completed and tested.

## Setup

1. Install Node.js LTS and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to the Supabase project URL and publishable key.
5. Run `npx expo start`.

Never put a Supabase secret/service-role key in the mobile app. Keep Row Level Security enabled on every user-owned table.

## Database

The initial database tables are expected to be created in Supabase SQL Editor before connecting. The app expects the tables `customers`, `products`, `daily_attendance`, and `delivery_entries` from the DoodhWala schema.

## Business rules to preserve

- Morning-only delivery.
- Fixed daily quantities with per-day quantity overrides.
- Bill only actual delivered quantities.
- Companies: Heritage, Vijaya, Amul and Jersey.
- Company commission: ₹5 per net litre (not 5%).
- Keep company MRP separate from customer selling price.
- Packet quantities must not be converted to litres until packet volume is confirmed.
