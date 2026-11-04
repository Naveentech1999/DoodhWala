# DoodhWala

Milk delivery and billing management app built with Expo React Native and Supabase.

## Features

- Morning-only daily delivery attendance.
- Customer and product quantity management.
- Heritage, Vijaya, Amul and Jersey company reports.
- Monthly date-wise delivery history and customer bills.
- Customer-specific prices separate from company MRP.
- ₹5 commission per net litre (packet products excluded until packet volume is defined).
- Supabase email/password administrator authentication.
- Manual daily upload and local-first draft persistence.
- Smooth, restrained UI transitions and feedback.

## Setup

Requirements: Node.js LTS and npm.

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`, then run `npm start`.

Never put Supabase secret/service-role keys in the app. Keep Row Level Security enabled. The app expects the `customers`, `products`, `customer_products`, `daily_attendance`, `delivery_entries`, and `monthly_bills` tables created by the DoodhWala SQL setup.

## Accounting assumptions and data quality

- The customer selling price is stored separately from company MRP (e.g. Vijaya TM company MRP ₹64/L versus example customer price ₹69/L).
- Company commission is ₹5 per net litre, not 5 percent.
- Packet products remain packet units; no litre conversion is made until packet volume is confirmed.
- The source customer register must be validated before live billing. The example rate for customer 75 was not confirmed.

## Backup behaviour

Daily records remain locally editable and upload when the administrator presses **Upload**. The app upserts by owner/customer/date/product, reports success only after database writes finish, and supports restoring the authenticated owner's saved records. Complete a real upload/restore test before relying on this as the only backup.

## Project status

Initial Expo application scaffold. Configure Supabase, validate all 75 customer records and rates, and run a clean-install typecheck/build and live backup test before production use.
