# Skills & Description Fixes

## Issues Fixed

### Issue 1: Skills Not Saving to Database
**Problem:** When creating or updating jobs, the skills were sent from the frontend but were never saved to the database because the database table didn't have a `skills` column.

**Solution:**
1. Added `skills` column to `OpportunityEntity` (TEXT type to store comma-separated values)
2. Updated `OpportunityRequestDto` to accept skills array
3. Updated `OpportunityResponseDto` to return skills array
4. Modified `createOpportunity()` to convert skills array to comma-separated string before saving
5. Modified `updateOpportunity()` to handle skills updates
6. Modified `toDto()` to parse comma-separated skills back to array

### Issue 2: Description Not Syncing in Edit UI
**Problem:** When editing a job, the description field was empty even though the description was saved in the database.

**Solution:**
1. Added `description` field to frontend `Job` type (was missing)
2. Updated `mapBackendJob()` to include description from backend response
3. Added `defaultValue={job?.description || ""}` to the description textarea in edit form

## Files Modified

### Backend Files:

1. **`src/main/kotlin/com/iotabuild/hirewithfinder/opportunity/model/OpportunityEntity.kt`**
   - Added `skills` column (TEXT type)
   ```kotlin
   @Column(name = "skills", columnDefinition = "TEXT")
   var skills: String = "",
   ```

2. **`src/main/kotlin/com/iotabuild/hirewithfinder/opportunity/dto/OpportunityDtos.kt`**
   - Added `skills: List<String>` to `OpportunityResponseDto`

3. **`src/main/kotlin/com/iotabuild/hirewithfinder/opportunity/service/OpportunityService.kt`**
   - **createOpportunity()**: Converts skills list to comma-separated string
   - **updateOpportunity()**: Handles skills updates
   - **toDto()**: Parses comma-separated skills to list

### Frontend Files:

1. **`src/lib/finder-data.ts`**
   - Added `description?: string` to `Job` type

2. **`src/services/jobsService.ts`**
   - Added `description?: string` to `BackendJobPayload` interface (already existed)
   - Updated `mapBackendJob()` to include `description: raw.description || ""`

3. **`src/routes/jobs.tsx`**
   - Added `defaultValue={job?.description || ""}` to description textarea

### Database Migration:

**`add_skills_column.sql`** - SQL script to add skills column to existing database

## Database Migration Required

Before running the backend, you need to add the `skills` column to the `opportunities` table:

### Option 1: Run the SQL Script (Recommended)

```bash
# Connect to your PostgreSQL database and run:
psql -h aws-1-ap-south-1.pooler.supabase.com -U postgres.tdbsddpiqgtcrwaijpcj -d postgres -f add_skills_column.sql
```

OR execute the SQL directly in your database client:

```sql
ALTER TABLE opportunities ADD COLUMN skills TEXT DEFAULT '';
UPDATE opportunities SET skills = '' WHERE skills IS NULL;
```

### Option 2: Let Spring Boot Auto-Update (Not Recommended for Production)

The backend is configured with `ddl-auto: update` in `application.yaml`, so it should automatically create the column when you start the application. However, this is not recommended for production databases.

## Data Format

### Skills Storage:
- **Database:** Comma-separated string (e.g., `"React,TypeScript,Node.js"`)
- **API Request:** Array of strings (e.g., `["React", "TypeScript", "Node.js"]`)
- **API Response:** Array of strings (e.g., `["React", "TypeScript", "Node.js"]`)

### Description Storage:
- **Database:** TEXT column
- **API:** String

## Testing Instructions

### 1. Apply Database Migration

Run the migration script first:
```bash
psql -h your-db-host -U your-username -d your-database -f add_skills_column.sql
```

### 2. Rebuild Backend

```bash
cd d:\Backend\Collabbit\hirewithfinder-backend
.\gradlew clean build
.\gradlew bootRun
```

### 3. Test Creating a Job with Skills

**Via Frontend:**
1. Sign in to the application
2. Go to `/jobs` page
3. Click "Post a role"
4. Fill in:
   - Title: "Frontend Developer"
   - Company: "TestCorp"
   - Type: "Internship"
   - Skills: "React, TypeScript, Tailwind CSS"
   - Description: "We are looking for a talented frontend developer..."
5. Click "Publish role"
6. Verify:
   - Skills appear as badges on the job card
   - Job is saved to database

**Via API Test:**
```bash
# Get auth token first (sign in to web app, then check localStorage)
$token = "your-firebase-token"

$body = @{
    title = "Backend Developer Intern"
    company = "TestCorp"
    location = "Remote"
    type = "Internship"
    stipend = "30000"
    skills = @("Python", "Django", "PostgreSQL")
    description = "We are building amazing products..."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/jobs" -Method POST -Body $body -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "x-auth-token" = $token
} -UseBasicParsing
```

### 4. Test Editing a Job

**Via Frontend:**
1. Go to `/jobs` page
2. Click "Edit" on any job card
3. Verify:
   - Skills field shows existing skills (comma-separated)
   - Description textarea shows existing description
4. Modify skills or description
5. Click "Save changes"
6. Verify changes are saved

**Via API:**
```bash
$jobId = "2"  # Replace with actual job ID

$updateBody = @{
    title = "Senior Frontend Developer"
    skills = @("React", "TypeScript", "Next.js", "GraphQL")
    description = "Updated description..."
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8081/api/jobs/$jobId" -Method PUT -Body $updateBody -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
    "x-auth-token" = $token
} -UseBasicParsing
```

### 5. Verify Database

Check the database directly:
```sql
SELECT id, title, skills, description FROM opportunities ORDER BY created_at DESC LIMIT 5;
```

You should see:
- Skills stored as comma-separated strings
- Descriptions stored as text

## Expected Behavior After Fixes

### Creating a Job:
1. ✅ Skills are saved to database
2. ✅ Description is saved to database
3. ✅ Skills appear in GET response as array
4. ✅ Description appears in GET response

### Editing a Job:
1. ✅ Skills field is pre-filled with existing skills
2. ✅ Description textarea is pre-filled with existing description
3. ✅ Updated skills are saved to database
4. ✅ Updated description is saved to database

### Viewing Jobs:
1. ✅ Skills are displayed as badge pills
2. ✅ Description can be shown in detail view

## Troubleshooting

### Issue: "Column skills does not exist"
**Solution:** Run the database migration script

### Issue: Skills still not showing
**Solution:** 
1. Check browser console for API response
2. Verify backend is returning skills in response
3. Clear browser cache and reload

### Issue: Description field empty when editing
**Solution:**
1. Check if description is in the API response (browser DevTools → Network)
2. Verify the job object has description field
3. Check console for any TypeScript errors

### Issue: Backend fails to start after adding skills column
**Solution:**
1. Check if column was added successfully: 
   ```sql
   \d opportunities
   ```
2. If column exists with wrong type, drop and recreate:
   ```sql
   ALTER TABLE opportunities DROP COLUMN skills;
   ALTER TABLE opportunities ADD COLUMN skills TEXT DEFAULT '';
   ```

## API Changes

### POST /api/jobs
**Request Body (NEW):**
```json
{
  "title": "Frontend Developer",
  "company": "TestCorp",
  "location": "Remote",
  "type": "Internship",
  "stipend": "25000",
  "skills": ["React", "TypeScript", "Node.js"],
  "description": "Job description here...",
  "status": "Open"
}
```

### Response (NEW):
```json
{
  "id": "1",
  "title": "Frontend Developer",
  "company": "TestCorp",
  "location": "Remote",
  "type": "Internship",
  "stipend": "25000",
  "posted": "Aug 20, 2026",
  "applicants": 0,
  "status": "Open",
  "description": "Job description here...",
  "skills": ["React", "TypeScript", "Node.js"],
  "recruiterUid": "abc123",
  "createdAt": "2026-08-20T10:00:00Z"
}
```

## Notes

- Skills are stored as comma-separated values in the database for simplicity
- If you need advanced skills filtering/searching, consider creating a separate `job_skills` junction table
- Description supports multiline text (stored as TEXT in PostgreSQL)
- Both fields are optional (can be empty string or empty array)
