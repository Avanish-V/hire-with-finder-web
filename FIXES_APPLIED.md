# Jobs & Internships Fetching/Creation Fixes

## Issues Identified

1. **Empty array fallback issue** - `getJobs()` would return static data even when API returned empty array successfully
2. **Wrong endpoint for applicants** - Frontend called `/api/jobs/{id}/applicants` but backend exposes `/api/jobs/{id}/applications`
3. **Silent error handling** - Errors in create/update operations were swallowed, making debugging impossible
4. **Missing authentication checks** - No UI feedback when user tries to create jobs without being authenticated
5. **Poor error logging** - Minimal console output to diagnose issues

## Fixes Applied

### 1. Fixed `src/services/jobsService.ts`

**Changes:**
- Updated `getJobs()` to return backend data even when empty (removed `data.length > 0` check)
- Added comprehensive console logging for all API calls
- Improved `mapBackendJob()` to handle missing/empty skills gracefully
- Updated `BackendJobPayload` interface with all backend response fields
- Changed `createJob()` and `updateJob()` to throw errors instead of silent fallbacks
- Added detailed error logging with response status and body

**Key Logic:**
```typescript
// Now returns empty array from backend, doesn't fallback to static data
if (data.length === 0) {
  console.log("No jobs found from backend, returning empty array");
  return [];
}
```

### 2. Fixed `src/services/applicantsService.ts`

**Changes:**
- Changed endpoint from `/api/jobs/${jobId}/applicants` → `/api/jobs/${jobId}/applications`
- Added console logging for debugging

### 3. Enhanced `src/routes/jobs.tsx`

**Changes:**
- Added authentication checking with `useAuth()` hook
- Added authentication warning banner when user is not signed in
- Added loading state with spinner
- Added empty state messages for each tab
- Improved error handling in `handleCreate()` and `handleUpdate()`
- Added auth token logging for debugging
- Added redirect to auth page when authentication fails

### 4. Created Test Tool

**File:** `test-api.html`
- Standalone HTML page to test API endpoints
- Can test GET /api/jobs (public)
- Can test POST /api/jobs (with auth token)
- Checks browser localStorage for auth tokens
- Helps diagnose authentication and network issues

## Authentication Requirements

### Backend Security Configuration:
- **GET /api/jobs** - ✅ Public (no auth required)
- **POST /api/jobs** - ⚠️ Requires Firebase authentication
- **PUT /api/jobs/:id** - ⚠️ Requires Firebase authentication
- **DELETE /api/jobs/:id** - ⚠️ Requires Firebase authentication

### How Authentication Works:
1. User signs in via `/auth` page using Google Firebase Auth
2. Firebase returns an ID token
3. Token is stored in `localStorage` as `token`
4. All API requests include headers:
   - `Authorization: Bearer {token}`
   - `x-auth-token: {token}`
5. Backend validates token with Firebase Admin SDK

## Testing Instructions

### 1. Test Fetching Jobs (Should Work Now)

1. Open the app in browser
2. Navigate to `/jobs` page
3. Open browser console (F12)
4. Look for console logs:
   ```
   Jobs API response status: 200 true
   Jobs API data: [{...}]
   Mapped jobs: [{...}]
   ```
5. Jobs should display in the UI

### 2. Test Creating Jobs (Requires Authentication)

**Option A: Use the Web App**
1. Navigate to `/auth` page
2. Click "Continue with Google Account"
3. Sign in with Google
4. Navigate back to `/jobs`
5. Click "Post a role" button
6. Fill out the form
7. Click "Publish role"
8. Check console for logs:
   ```
   createJob called with data: {...}
   Sending POST request to /api/jobs
   POST /api/jobs response: 201 true
   Created job response: {...}
   ```

**Option B: Use the Test Tool**
1. Open `test-api.html` in browser
2. Sign in to the main app first
3. Go back to test-api.html
4. Click "Load from localStorage" to load auth token
5. Fill in job details
6. Click "Create Job"
7. Check the response

### 3. Check If You're Authenticated

Run in browser console:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('token'));

// Check user data
console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'));

// Test API call
fetch('http://localhost:8081/api/jobs', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'x-auth-token': localStorage.getItem('token')
  }
}).then(r => r.json()).then(console.log);
```

## Common Issues & Solutions

### Issue: "No jobs showing"
**Solution:** 
- Check console for "Jobs API response status" log
- If status is 200 but no jobs, backend DB is empty
- If status is 5XX, backend is down
- If no log appears, check network tab for CORS errors

### Issue: "Can't create jobs"
**Solution:**
- Check if you're signed in (look for warning banner)
- Check console for auth token: `localStorage.getItem('token')`
- If no token, sign in via `/auth` page
- If token exists but still fails, check console for 401/403 errors

### Issue: "Authentication required" banner shows but I'm signed in"
**Solution:**
- Check if token is actually in localStorage
- Token might have expired - sign out and sign in again
- Clear localStorage and sign in fresh:
  ```javascript
  localStorage.clear();
  window.location.href = '/auth';
  ```

### Issue: "Backend returning 401/403"
**Solution:**
- Firebase token might be invalid/expired
- Backend Firebase admin configuration might be wrong
- Check backend logs for Firebase authentication errors

## Backend Verification

To verify backend is running correctly:

```powershell
# Test GET endpoint (should work)
Invoke-WebRequest -Uri "http://localhost:8081/api/jobs" -UseBasicParsing

# Test POST endpoint (should return 401 without auth)
$body = '{"title":"Test","company":"Test","type":"Internship"}' 
Invoke-WebRequest -Uri "http://localhost:8081/api/jobs" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
```

## Next Steps

1. **Sign in to the application**
   - Go to http://localhost:PORT/auth
   - Sign in with Google

2. **Test job creation**
   - Navigate to /jobs
   - Click "Post a role"
   - Fill out form and submit

3. **Check console logs**
   - All API calls now have detailed logging
   - Errors will show exact status codes and responses

4. **If still not working**
   - Open test-api.html
   - Use it to isolate if issue is with auth, network, or backend
   - Check Network tab in DevTools for failed requests
   - Verify backend is running on port 8081

## Files Modified

1. `src/services/jobsService.ts` - Fixed fetching, creation, updating logic
2. `src/services/applicantsService.ts` - Fixed endpoint URL
3. `src/routes/jobs.tsx` - Added auth checking, error handling, loading states
4. `test-api.html` - NEW: Test tool for debugging

## Environment Check

Make sure `.env` has correct values:
```env
VITE_API_URL=http://localhost:8081
VITE_FIREBASE_API_KEY=<your-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-domain>
# ... other Firebase config
```
