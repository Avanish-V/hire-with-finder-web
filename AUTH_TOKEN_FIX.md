# Authentication Token Fix - 401 Unauthorized on Course Update

## Problem
When trying to update a course via `PUT /api/courses/{id}`, the request was returning **401 Unauthorized** error.

## Root Cause
The issue had multiple contributing factors:

1. **Expired Token**: Firebase ID tokens expire after 1 hour, and the stored token in localStorage was likely expired
2. **Missing Token Refresh**: The frontend was not refreshing the Firebase token before making authenticated API requests
3. **Redundant Headers**: The code was sending both `x-auth-token` and `Authorization: Bearer` headers (only `Authorization: Bearer` is needed)

## Solution Applied

### Updated `apiClient.ts`

1. **Added `getFreshAuthToken()` function**:
   - Checks if a Firebase user is currently signed in
   - Gets a fresh token from Firebase using `currentUser.getIdToken(false)`
   - Updates the stored token in localStorage
   - Falls back to stored token if Firebase user is not available

2. **Updated `apiRequest()` function**:
   - Now calls `getFreshAuthToken()` instead of `getAuthToken()`
   - Ensures every API request uses a valid, non-expired token
   - Removed redundant `x-auth-token` header (only sends `Authorization: Bearer`)

### Backend Security Configuration
The backend is correctly configured in `SecurityConfig.kt`:
- GET requests to `/api/courses/**` are public (no auth required)
- POST, PUT, DELETE requests require Firebase authentication
- `FirebaseTokenFilter` validates the token in `Authorization: Bearer <token>` header

## How It Works Now

1. User signs in with Google → Firebase ID token is stored in localStorage
2. User tries to update a course → Frontend calls `apiRequest()`
3. `apiRequest()` calls `getFreshAuthToken()`:
   - If Firebase user is signed in → Gets fresh token from Firebase
   - Updates localStorage with fresh token
   - Returns the fresh token
4. Token is sent in `Authorization: Bearer <token>` header
5. Backend validates the token and allows the request

## Testing

### 1. Verify Token is Being Sent
Open browser DevTools → Network tab → Find the PUT request to `/api/courses/3`:

**Request Headers should include**:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjhlM...
Content-Type: application/json
```

### 2. Test Course Update
1. Sign in to the application
2. Navigate to Live Sessions
3. Click on a course you created
4. Click "Edit" button
5. Make changes and click "Save"
6. Should succeed with 200 OK response

### 3. Test Token Refresh
1. Sign in and wait for 1 hour (or manually delete localStorage token)
2. Try to update a course
3. Should automatically refresh token and succeed

## Alternative Fix (If Still Getting 401)

If you're still getting 401 errors, try these troubleshooting steps:

### Option 1: Use Mock Token for Development
For testing purposes, update the token in localStorage:
```javascript
localStorage.setItem('token', 'mock-token-12345');
```

The backend `FirebaseTokenFilter` accepts tokens starting with `mock-token` or `test-token` for development.

### Option 2: Check Firebase User State
Add this to your browser console:
```javascript
import { auth } from './lib/firebaseClient';
console.log('Current user:', auth.currentUser);
console.log('Token:', localStorage.getItem('token'));
```

If `auth.currentUser` is null, the user needs to sign in again.

### Option 3: Force Token Refresh
Modify the `getFreshAuthToken()` call to force refresh:
```typescript
const freshToken = await currentUser.getIdToken(true); // Force refresh
```

## Backend Security Notes

From `SecurityConfig.kt`, these endpoints require authentication:
- POST `/api/courses` - Create course
- PUT `/api/courses/{id}` - Update course
- DELETE `/api/courses/{id}` - Delete course
- POST `/api/courses/{id}/enroll` - Enroll in course

These endpoints are public:
- GET `/api/courses` - List courses
- GET `/api/courses/{id}` - Get course details
- GET `/api/courses/{id}/content` - Get course content
- GET `/api/courses/{id}/students` - Get enrolled students

## Files Modified

1. `src/lib/apiClient.ts`:
   - Added `getFreshAuthToken()` function
   - Updated `apiRequest()` to use fresh tokens
   - Removed redundant `x-auth-token` header

## Benefits

1. **Automatic Token Refresh**: Tokens are refreshed before each request
2. **No More 401 Errors**: Valid tokens ensure successful authenticated requests
3. **Better Security**: Fresh tokens reduce risk of using expired credentials
4. **Seamless UX**: Users don't need to sign in again when tokens expire

## Related Files

- `src/lib/apiClient.ts` - API client with token management
- `src/lib/firebaseClient.ts` - Firebase authentication
- `src/lib/authContext.tsx` - Authentication context provider
- `hirewithfinder-backend/src/main/kotlin/com/iotabuild/hirewithfinder/security/FirebaseTokenFilter.kt` - Backend token validation

---

**Status**: ✅ Fixed
**Date**: 2026-08-20
**Issue**: 401 Unauthorized on PUT /api/courses/{id}
**Solution**: Automatic Firebase token refresh before API requests
