# Doctor Booking — Project Agent Rules

## Project Identity
This is a full-stack **Doctor Appointment Booking** platform. Always reason with knowledge of both the **backend** (Express 5 + Prisma + PostgreSQL on port 5000) and **frontend** (Next.js App Router on port 3000).

## Code Conventions

### Backend
- All modules follow the pattern: `*.controller.ts` → `*.service.ts` → `*.router.ts`
- Use Zod for validation via the `validate` middleware
- Errors: throw `new AppError(message, statusCode)` — never return raw errors
- Prisma: import only from `src/config/db.ts`
- Express 5: no need for `try/catch` + `next(err)` in async handlers — errors propagate automatically

### Frontend
- Next.js App Router — use route groups: `(auth)`, `(patient)`, `(doctor)`, `(admin)`
- All API calls go through helpers in `frontend/lib/`
- Use TypeScript strictly — no `any` types without justification

## Schema Awareness
- `Doctor.isSuspended` and `User.isActive` exist in the database but are NOT in `schema.prisma` (added via raw ALTER TABLE at startup). Always account for them.

## When Modifying the Database
1. Update `schema.prisma` first
2. Run `npm run db:migrate` from the `/backend` directory
3. Never use raw SQL for new features — prefer Prisma migrations

## When Adding New API Routes
1. Create/update in the appropriate module under `src/modules/`
2. Register the route in the module's `*.router.ts`
3. Apply `authenticate` + `authorize` middleware as needed
4. Add corresponding frontend API call in `frontend/lib/`
