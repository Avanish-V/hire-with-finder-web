# Seats Field Missing in Course Creation Payload - Fix

## Problem
When creating or updating a course, the `seats` field was not being sent to the backend API, even though the user might have specified the number of seats in the form.

## Root Cause
The `sessionsService.ts` had two issues:

1. **In `createSession()` function**: The `backendBody` object was missing the `seats` field
2. **In `updateSession()` function**: The `backendUpdates` object was not including the `seats` field

This meant that even if the user specified a number like 50 or 200 seats, it wasn't being sent to the backend, and the backend would use its default value (100 seats).

## Solution Applied

### Updated `sessionsService.ts`

#### 1. Fixed `createSession()` function
Added the `seats` field to the `backendBody` object:

```typescript
const backendBody = {
  title: (sessionData.title || "Live Skill Session").trim(),
  instructor: (sessionData.host || "Finder Careers").trim(),
  description: (sessionData.summary || "...").trim(),
  duration: (sessionData.duration || "90 min").trim(),
  price: priceNum,
  thumbnail: sessionData.thumbnail || "",
  liveUrl: sessionData.meetLink || "https://meet.google.com/fdr-live",
  category: sessionData.tags?.join(", ") || "Live Workshop",
  level: sessionData.level || "Beginner",
  active: true,
  seats: sessionData.seats || 100,  // ✅ ADDED THIS LINE
  date: sessionData.date || "",
  time: sessionData.time || "",
  modules: sessionData.modules || [],
};
```

#### 2. Fixed `updateSession()` function
Added the `seats` field to the `backendUpdates` object:

```typescript
const backendUpdates: Record<string, unknown> = {};
if (updates.title) backendUpdates.title = updates.title.trim();
if (updates.host) backendUpdates.instructor = updates.host.trim();
if (updates.summary) backendUpdates.description = updates.summary.trim();
if (updates.duration) backendUpdates.duration = updates.duration.trim();
if (priceNum !== undefined) backendUpdates.price = priceNum;
if (updates.thumbnail !== undefined) backendUpdates.thumbnail = updates.thumbnail;
if (updates.meetLink !== undefined) backendUpdates.liveUrl = updates.meetLink;
if (updates.level) backendUpdates.level = updates.level;
if (updates.tags) backendUpdates.category = updates.tags.join(", ");
if (updates.seats !== undefined) backendUpdates.seats = updates.seats;  // ✅ ADDED THIS LINE
if (updates.date !== undefined) backendUpdates.date = updates.date;
if (updates.time !== undefined) backendUpdates.time = updates.time;
if (updates.modules !== undefined) backendUpdates.modules = updates.modules;
```

## Backend Verification

The backend `CourseRequestDto` already accepts the `seats` field:

```kotlin
data class CourseRequestDto(
    @field:NotBlank(message = "Title is required")
    val title: String,
    val instructor: String? = null,
    // ... other fields ...
    val seats: Int? = 100,  // ✅ Backend accepts this
    val date: String? = null,
    val time: String? = null,
    val modules: List<ModuleDto>? = null
)
```

Default value is 100 seats if not provided.

## How It Works Now

### Creating a Course
1. User fills out the course form, including seats (e.g., 50)
2. Form calls `createSession()` with `sessionData.seats = 50`
3. `backendBody` now includes `seats: 50`
4. POST request to `/api/courses` with seats in payload
5. Backend creates course with 50 seats ✅

### Updating a Course
1. User edits a course and changes seats from 100 to 200
2. Form calls `updateSession()` with `updates.seats = 200`
3. `backendUpdates` now includes `seats: 200`
4. PUT request to `/api/courses/{id}` with seats in payload
5. Backend updates course with 200 seats ✅

## Testing

### Test Course Creation with Custom Seats
1. Navigate to Live Sessions page
2. Click "Create New Session"
3. Fill out the form:
   - Title: "React Masterclass"
   - Instructor: "John Doe"
   - **Seats: 50** (instead of default 100)
4. Click "Create"
5. Verify in Network tab that POST request includes:
   ```json
   {
     "title": "React Masterclass",
     "instructor": "John Doe",
     "seats": 50,
     ...
   }
   ```

### Test Course Update with Changed Seats
1. Click on an existing course
2. Click "Edit"
3. Change seats from 100 to 200
4. Click "Save"
5. Verify in Network tab that PUT request includes:
   ```json
   {
     "seats": 200,
     ...
   }
   ```

### Verify in Database
After creating or updating, check the course in the database:
```sql
SELECT id, title, seats FROM courses WHERE id = <course_id>;
```

Should show the custom seat value (50 or 200) instead of default 100.

## API Payloads

### POST /api/courses (Create)
```json
{
  "title": "React Masterclass",
  "instructor": "John Doe",
  "description": "Learn React from scratch",
  "duration": "90 min",
  "price": 0,
  "thumbnail": "",
  "liveUrl": "https://meet.google.com/xyz-abc",
  "category": "Live Workshop",
  "level": "Beginner",
  "active": true,
  "seats": 50,
  "date": "Aug 25, 2026",
  "time": "7:00 PM IST",
  "modules": []
}
```

### PUT /api/courses/{id} (Update)
```json
{
  "title": "React Masterclass - Advanced",
  "seats": 200,
  "level": "Advanced"
}
```

## Default Behavior

If `seats` is not provided in the frontend form:
- Frontend sends `seats: 100` (default)
- Backend accepts it and stores 100
- This ensures courses always have a seat limit

## Related Files

- **Fixed**: `src/services/sessionsService.ts`
  - `createSession()` function
  - `updateSession()` function

- **Backend**: `hirewithfinder-backend/src/main/kotlin/com/iotabuild/hirewithfinder/course/dto/CourseDtos.kt`
  - `CourseRequestDto` (already accepts seats)
  - `CourseResponseDto` (returns seats)

## Benefits

1. ✅ Users can now set custom seat limits per course
2. ✅ Seat limits are properly saved to the database
3. ✅ Enrollment logic can properly check against seat limits
4. ✅ Course updates preserve or change seat limits as intended

## Future Enhancements

1. **Seat Availability Check**: Validate enrollment against available seats
2. **Seat Counter**: Show "X out of Y seats filled" in the UI
3. **Waitlist**: Allow users to join a waitlist when seats are full
4. **Dynamic Pricing**: Adjust price based on seat availability

---

**Status**: ✅ Fixed
**Date**: 2026-08-20
**Issue**: Seats field missing in course creation/update payload
**Solution**: Added seats field to both createSession() and updateSession() functions
