# Time Format Fix - AM/PM Support

## Problem
When creating or updating courses, the start time was being saved to the database as "02:06" (24-hour format) instead of "2:06 PM IST" (12-hour format with AM/PM).

## Root Cause
The HTML5 `<input type="time">` element returns time values in 24-hour format (HH:mm) like "14:06", without AM/PM designation. This value was being sent directly to the backend without conversion.

## Solution Applied

### Frontend Changes (sessions.tsx)

Added two utility functions to convert between time formats:

1. **formatTimeTo12Hour**: Converts 24-hour format to 12-hour format with AM/PM
   ```typescript
   "14:06" → "2:06 PM IST"
   "09:30" → "9:30 AM IST"
   "00:00" → "12:00 AM IST"
   ```

2. **formatTimeTo24Hour**: Converts 12-hour format with AM/PM back to 24-hour format
   ```typescript
   "2:06 PM IST" → "14:06"
   "9:30 AM IST" → "09:30"
   "12:00 AM IST" → "00:00"
   ```

### How It Works

**When Creating/Editing:**
1. User selects time using HTML5 time picker (24-hour format internally)
2. On submit, `formatTimeTo12Hour()` converts the value to 12-hour format with AM/PM
3. Backend receives and stores: "2:06 PM IST"

**When Loading for Edit:**
1. Backend returns time as: "2:06 PM IST"
2. `formatTimeTo24Hour()` converts it to "14:06" for the time input
3. Time picker displays the correct time

## Files Modified
- `src/routes/sessions.tsx` - Added time conversion functions and updated form handling

## Testing
After this fix:
1. Create a new course with time "2:06 PM"
2. Check database - should show "2:06 PM IST" (not "14:06")
3. Edit the course - time picker should show 2:06 PM correctly
4. Frontend display should show "2:06 PM IST"

## Technical Details

### Time Input Behavior
- HTML5 `<input type="time">` always uses 24-hour format internally
- Modern browsers show 12-hour or 24-hour picker based on user's locale
- The value returned is always in HH:mm format (24-hour)

### Conversion Logic
- **PM times**: Add 12 to hour (except 12 PM stays as 12)
- **AM times**: Keep as-is (except 12 AM becomes 00)
- **IST suffix**: Added for clarity (Indian Standard Time)

## Backward Compatibility
If existing database records have time in 24-hour format:
- They will be converted to 12-hour format when edited and saved
- The `formatTimeTo24Hour()` function handles both formats gracefully
- Returns empty string if format is unrecognized
