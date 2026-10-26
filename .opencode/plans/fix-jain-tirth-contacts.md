# Fix Jain Tirth Contact Person Fields

## Problem
The backend API returns `contact_person_name_1`, `contact_person_phone_1`, `contact_person_name_2`, `contact_person_phone_2` as flat fields (see API response). The frontend form collects contacts in a `contacts` array and sends `contacts`, `contact_person`, `contact_number` - but the backend expects the flat field names, so contacts aren't saved.

## Root Cause
1. **Types** (`src/types/index.ts`): `JainTirthCreateInput`/`JainTirthRecord` don't have the flat contact fields
2. **Form** (`src/pages/jain-tirths/JainTirthFormDialog.tsx`): Builds payload with `contacts`, `contact_person`, `contact_number` but backend expects `contact_person_name_1/2`, `contact_person_phone_1/2`
3. **Form loading**: When editing, it reads from `detail.contacts` array or falls back to `contact_person/contact_number` - needs to also read from flat fields

## Solution
Update types, form loading logic, and form save payload to use the flat field names the backend expects.

### Changes needed

**1. `src/types/index.ts`**
- Add to `JainTirthRecord`: `contact_person_name_1?: string | null`, `contact_person_phone_1?: string | null`, `contact_person_name_2?: string | null`, `contact_person_phone_2?: string | null`
- Add to `JainTirthCreateInput`: same four flat fields (keep existing for backward compat if needed)

**2. `src/pages/jain-tirths/JainTirthFormDialog.tsx`**
- In load effect (around line 174-200): When populating form from detail, check flat fields first
- In save (around line 301-319): Build payload with flat fields from cleanedContacts
