# Course Date & Time Implementation

## Overview
Implemented date and start time fields for creating and updating courses/live sessions in hire-with-finder-web.

## Changes Made

### Backend Changes

#### 1. Database Entity (`CourseEntity.kt`)
Added two new fields:
```kotlin
@Column(name = "scheduled_date")
var scheduledDate: String? = null

@Column(name = "start_time")
var startTime: String? = null
```

#### 2. DTOs (`CourseDtos.kt`)
Updated request and response DTOs:

**CourseRequestDto:**
```kotlin
val date: String? = null,
val time: String? = null,
```

**CourseResponseDto:**
```kotlin
val date: String,
val time: String,
```

#### 3. Service Layer (`CourseService.kt`)
Updated CRUD operations:

**createCourse:**
```kotlin
scheduledDate = request.date?.trim(),
startTime = request.time?.trim()
```

**updateCourse:**
```kotlin
request.date?.let { entity.scheduledDate = it.trim() }
request.time?.let { entity.startTime = it.trim() }
```

**toDto:**
```kotlin
date = entity.scheduledDate ?: "",
time = entity.startTime ?: "",
```

### Frontend Changes

#### 1. Service Layer (`sessionsService.ts`)

**mapBackendSession:**
Already handles date and time from backend response with fallbacks

**createSession:**
Added date and time to backend request:
```typescript
date: sessionData.date || "",
time: sessionData.time || "",
modules: sessionData.modules || [],
```

**updateSession:**
Added date and time to updates:
```typescript
if (updates.date !== undefined) backendUpdates.date = updates.date;
if (updates.time !== undefined) backendUpdates.time = updates.time;
if (updates.modules !== undefined) backendUpdates.modules = updates.modules;
```

#### 2. UI Form (`sessions.tsx`)
Form already has date and time fields with proper handling:

**Date Input:**
```tsx
<Input id="s-date" type="date" defaultValue={session?.date} required />
```

**Time Input:**
```tsx
<Input id="s-time" type="time" defaultValue={session?.time} required />
```

**handleSubmit:**
Already reads and submits date and time:
```tsx
const date = (document.getElementById("s-date") as HTMLInputElement)?.value;
const time = (document.getElementById("s-time") as HTMLInputElement)?.value;

onSubmit({
  // ...
  date: date || "Aug 25, 2026",
  time: time || "7:00 PM IST",
  // ...
});
```

## Database Migration

### Required Action
Run the database migration to add the new columns:

**Using psql:**
```bash
psql -h aws-1-ap-south-1.pooler.supabase.com \
     -U postgres.tdbsddpiqgtcrwaijpcj \
     -d postgres \
     -f add_date_time_columns.sql
```

**Or execute directly:**
```sql
ALTER TABLE courses ADD COLUMN scheduled_date VARCHAR(255);
ALTER TABLE courses ADD COLUMN start_time VARCHAR(255);
```

### Migration Script
The script `add_date_time_columns.sql` includes:
- ✅ Check if columns already exist
- ✅ Add columns with proper data types
- ✅ Verification query
- ✅ Optional default value updates

## Data Format

### Storage Format
- **scheduled_date**: String (e.g., "Aug 25, 2026", "2026-08-25")
- **start_time**: String (e.g., "7:00 PM IST", "19:00")

### API Format

**Request (POST/PUT /api/courses):**
```json
{
  "title": "System Design Workshop",
  "instructor": "Finder Careers",
  "date": "2026-08-25",
  "time": "19:00",
  "duration": "90 min",
  // ... other fields
}
```

**Response (GET /api/courses):**
```json
{
  "id": "1",
  "title": "System Design Workshop",
  "date": "Aug 25, 2026",
  "time": "7:00 PM IST",
  "duration": "90 min",
  // ... other fields
}
```

## Testing

### 1. Test Creating a Course

**Via Frontend:**
1. Go to `/sessions` page
2. Click "Create a live skill session"
3. Fill in the form:
   - Upload thumbnail
   - Enter title
   - **Select date** (using date picker)
   - **Select time** (using time picker)
   - Enter duration
   - Add modules
4. Click "Schedule session"
5. Verify in database:
   ```sql
   SELECT id, title, scheduled_date, start_time FROM courses ORDER BY id DESC LIMIT 1;
   ```

**Via API:**
```bash
curl -X POST http://localhost:8081/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Frontend Development Masterclass",
    "instructor": "John Doe",
    "date": "2026-09-15",
    "time": "18:00",
    "duration": "2 hours",
    "price": 499,
    "seats": 50
  }'
```

### 2. Test Updating a Course

**Via Frontend:**
1. Go to `/sessions` page
2. Click "Edit" on a session card
3. Modify date or time
4. Click "Save changes"
5. Verify the changes are reflected

**Via API:**
```bash
curl -X PUT http://localhost:8081/api/courses/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "date": "2026-09-20",
    "time": "19:30"
  }'
```

### 3. Test Fetching Courses

```bash
curl http://localhost:8081/api/courses
```

Should return courses with `date` and `time` fields populated.

### 4. Verify in Database

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('scheduled_date', 'start_time');

-- Check actual data
SELECT id, title, scheduled_date, start_time, created_at 
FROM courses 
ORDER BY created_at DESC 
LIMIT 5;
```

## Expected Behavior

### Creating a Course
✅ Date field shows HTML5 date picker
✅ Time field shows HTML5 time picker
✅ Default values: "Aug 25, 2026" and "7:00 PM IST"
✅ Date and time are saved to database
✅ Date and time are returned in API response

### Editing a Course
✅ Date input is pre-filled with existing date
✅ Time input is pre-filled with existing time
✅ Changes to date/time are saved
✅ Updated values are reflected in list view

### Viewing Courses
✅ Date is displayed on session cards
✅ Time is displayed on session cards
✅ Full session view shows both date and time

## Troubleshooting

### Issue: Columns don't exist error

**Error:**
```
ERROR: column "scheduled_date" of relation "courses" does not exist
```

**Solution:**
Run the database migration:
```bash
psql -h your-host -U your-user -d postgres -f add_date_time_columns.sql
```

### Issue: Date/time not saving

**Check:**
1. Are the fields being read from the form?
   ```typescript
   console.log("Date:", date, "Time:", time);
   ```

2. Are they being sent to the backend?
   ```typescript
   console.log("Sending to backend:", backendBody);
   ```

3. Are they being saved in the entity?
   ```kotlin
   println("Saving course with date: ${entity.scheduledDate}, time: ${entity.startTime}")
   ```

### Issue: Date/time not showing when editing

**Check:**
1. Is the session object loaded with date and time?
   ```typescript
   console.log("Editing session:", session);
   ```

2. Are the input fields getting the defaultValue?
   ```tsx
   defaultValue={session?.date}
   defaultValue={session?.time}
   ```

### Issue: Date format mismatch

The frontend sends date as string (could be "Aug 25, 2026" or "2026-08-25").
The backend stores it as-is.
Make sure your frontend consistently formats the date before sending.

**Recommended:**
Use ISO format (YYYY-MM-DD) for date input:
```tsx
<Input id="s-date" type="date" defaultValue={formatDateForInput(session?.date)} />
```

Helper function:
```typescript
function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
  } catch {
    return "";
  }
}
```

## Files Modified

### Backend:
1. **`CourseEntity.kt`** - Added scheduledDate and startTime columns
2. **`CourseDtos.kt`** - Added date and time to DTOs
3. **`CourseService.kt`** - Handle date and time in CRUD operations
4. **`add_date_time_columns.sql`** (NEW) - Database migration script

### Frontend:
1. **`sessionsService.ts`** - Added date and time to create/update requests
2. **`sessions.tsx`** - Already had date and time form fields

## Notes

- Date and time are stored as strings for flexibility
- Frontend can display them in any format
- Backend doesn't validate date/time format
- For production, consider:
  - Using proper date/time types (LocalDate, LocalTime)
  - Adding validation
  - Adding timezone support
  - Adding scheduling/reminder features

## Next Steps

Consider enhancing with:
1. **Timezone support** - Store timezone alongside time
2. **Date validation** - Prevent past dates
3. **Time slots** - Show available time slots
4. **Calendar integration** - Export to Google Calendar/iCal
5. **Reminders** - Send reminder emails before session starts
6. **Recurring sessions** - Support for weekly/monthly sessions
