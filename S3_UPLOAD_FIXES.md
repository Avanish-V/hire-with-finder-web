# S3 Thumbnail Upload Fixes

## Issue Description
When creating or editing courses/sessions in hire-with-finder-web, uploading thumbnails/banners was failing with "Failed to upload thumbnail to S3" error.

## Root Causes Identified

### 1. **Silent Failures** - Poor Error Visibility
- Frontend was catching errors but not logging details
- Backend had no error handling or logging
- Users only saw generic "Failed to upload" messages

### 2. **Potential AWS Credentials Issues**
- AWS credentials are hardcoded in `AwsConfig.kt`
- If credentials are invalid/expired, S3 operations will fail silently
- No validation of credentials on startup

### 3. **Missing Error Context**
- No console logs to trace the upload flow
- No indication of which step failed (presign vs upload vs verification)

## Fixes Applied

### Frontend: Enhanced Error Handling & Logging

**File: `src/services/mediaService.ts`**

**Changes:**
1. Added detailed console logging at every step:
   - Request parameters
   - Response status
   - Response data
   - Error details

2. Better error messages:
   - Specific error for missing presigned URL
   - HTTP status codes in error messages
   - Network error differentiation

3. Improved error throwing:
   - Throws errors instead of silent fallback in critical paths
   - Preserves error context for debugging

**Key improvements:**
```typescript
// Before: Silent failure
if (!presignData) {
  // Falls back to base64 silently
}

// After: Throws error with context
if (!presignData) {
  console.error("No presigned data received from backend");
  throw new Error("Failed to get presigned upload URL from backend");
}
```

### Backend: Error Handling & Logging

**File: `src/main/kotlin/.../media/service/S3Service.kt`**

**Changes:**
1. Added try-catch block around presigned URL generation
2. Added println logging for:
   - Request parameters
   - Generated URLs
   - Error stack traces

3. Throws RuntimeException with context when AWS SDK fails

**Key improvements:**
```kotlin
try {
    println("Generating presigned URL for: bucket=$bucketName, key=$key")
    // ... generate URL
    println("Generated presigned URL successfully: uploadUrl=$uploadUrl")
    return PresignedUrlResponse(...)
} catch (e: Exception) {
    println("ERROR generating presigned URL: ${e.message}")
    e.printStackTrace()
    throw RuntimeException("Failed to generate presigned S3 URL: ${e.message}", e)
}
```

### Test Tool Created

**File: `test-s3-upload.html`**

A standalone HTML page to test the complete S3 upload flow:
- Step-by-step upload process visualization
- Test presigned URL generation separately
- Check backend health
- Display uploaded image
- Clear error messages at each step

## How to Diagnose Issues

### 1. Open the Test Tool

Open `test-s3-upload.html` in your browser and:
1. Click "Check Backend Health" - Verify backend is running
2. Select an image file
3. Click "Test Presign Only" - Verify presigned URL generation works
4. Click "Upload to S3" - Test the complete flow

### 2. Check Browser Console

In the main app, open DevTools Console and look for:
```
Requesting presigned URL: /api/media/presign?...
Presigned URL response status: 200 true
Presigned URL data: {...}
Uploading to S3 via presigned URL: ...
S3 upload response: 200 OK
S3 upload successful, file URL: ...
```

### 3. Check Backend Logs

In the backend terminal, look for:
```
Generating presigned URL for: bucket=campuscircle, key=...
Generated presigned URL successfully: uploadUrl=...
```

If you see errors:
```
ERROR generating presigned URL: ...
```

## Common Issues & Solutions

### Issue 1: "Failed to get presigned upload URL from backend"

**Possible Causes:**
- Backend not running
- Backend returned non-200 status
- CORS issues
- Authentication issues

**Diagnosis:**
```javascript
// Check in browser console:
fetch('http://localhost:8081/api/media/presign?fileName=test.jpg&contentType=image/jpeg&folder=live-skills/thumbnails')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Solutions:**
- Verify backend is running on port 8081
- Check if `/api/media/presign` is accessible (should be public)
- Check browser Network tab for actual HTTP status
- Verify CORS configuration allows your origin

### Issue 2: "S3 upload failed with status: 403"

**Possible Causes:**
- Invalid AWS credentials
- Bucket doesn't exist
- Bucket permissions don't allow PUT
- Region mismatch

**Diagnosis:**
Check backend logs for AWS SDK errors

**Solutions:**
1. **Verify AWS Credentials:**
   ```kotlin
   // In AwsConfig.kt - check these values:
   accessKey: String = "AKIASGI2PLFWRLQWX47N"
   secretKey: String = "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"
   ```
   
2. **Test credentials manually:**
   ```bash
   aws s3 ls s3://campuscircle --profile test
   ```

3. **Verify bucket exists:**
   ```bash
   aws s3api head-bucket --bucket campuscircle --region ap-south-1
   ```

4. **Check bucket policy allows PutObject:**
   ```json
   {
     "Effect": "Allow",
     "Action": "s3:PutObject",
     "Resource": "arn:aws:s3:::campuscircle/*"
   }
   ```

### Issue 3: "S3 upload failed with status: 400/404"

**Possible Causes:**
- Malformed presigned URL
- Expired presigned URL (>15 minutes)
- Content-Type mismatch
- Key contains invalid characters

**Diagnosis:**
Check the generated presigned URL structure

**Solutions:**
- Verify URL is well-formed
- Check key sanitization (only allows: a-zA-Z0-9._-)
- Ensure Content-Type matches between presign and upload
- Try uploading immediately after getting presigned URL

### Issue 4: Network/CORS errors

**Possible Causes:**
- Browser blocking S3 request
- S3 bucket CORS not configured
- Mixed content (HTTPS page → HTTP S3)

**Solutions:**
1. **Configure S3 CORS:**
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

2. **Use HTTPS for S3 URLs** (already configured in code)

## Testing Checklist

### Before Deployment:
- [ ] Backend starts without errors
- [ ] Test tool successfully uploads an image
- [ ] Main app successfully uploads course thumbnail
- [ ] Main app successfully uploads session banner
- [ ] Uploaded images are accessible via returned URL
- [ ] Console logs show detailed upload flow
- [ ] Backend logs show presigned URL generation

### AWS Prerequisites:
- [ ] S3 bucket `campuscircle` exists in `ap-south-1`
- [ ] IAM user has valid credentials
- [ ] IAM user has `s3:PutObject` permission
- [ ] Bucket CORS is configured for browser uploads
- [ ] Bucket policy allows public read (or CloudFront configured)

## Environment Configuration

### Backend Configuration

**Current (Hardcoded):**
```kotlin
accessKey = "AKIASGI2PLFWRLQWX47N"
secretKey = "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"
region = "ap-south-1"
bucketName = "campuscircle"
```

**Recommended (Environment Variables):**

Add to `application.yaml`:
```yaml
aws:
  s3:
    access-key: ${AWS_S3_ACCESS_KEY:AKIASGI2PLFWRLQWX47N}
    secret-key: ${AWS_S3_SECRET_KEY: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}
    region: ${AWS_S3_REGION:ap-south-1}
    bucket-name: ${AWS_S3_BUCKET:campuscircle}
```

Then set environment variables:
```bash
export AWS_S3_ACCESS_KEY="your-access-key"
export AWS_S3_SECRET_KEY="your-secret-key"
export AWS_S3_REGION="ap-south-1"
export AWS_S3_BUCKET="campuscircle"
```

## Files Modified

### Frontend:
1. **`src/services/mediaService.ts`**
   - Added comprehensive logging
   - Improved error handling
   - Better error messages

### Backend:
1. **`src/main/kotlin/.../media/service/S3Service.kt`**
   - Added try-catch error handling
   - Added logging for debugging
   - Added detailed error messages

### Testing:
1. **`test-s3-upload.html`** (NEW)
   - Standalone S3 upload test tool
   - Step-by-step visualization
   - Detailed error reporting

## Next Steps

1. **Test the upload:**
   - Open test-s3-upload.html
   - Upload a test image
   - Check console logs

2. **If test succeeds but app fails:**
   - Check authentication (user must be signed in)
   - Check if session data is being passed correctly
   - Compare test tool network requests with app requests

3. **If test fails:**
   - Check backend logs for AWS SDK errors
   - Verify AWS credentials are valid
   - Check S3 bucket permissions
   - Test AWS credentials with AWS CLI

4. **For production:**
   - Move AWS credentials to environment variables
   - Consider using IAM roles instead of access keys
   - Set up CloudFront for better performance
   - Configure proper bucket policies
   - Enable S3 access logging

## Additional Resources

- AWS S3 Presigned URLs: https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html
- AWS SDK for Java: https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/examples-s3-presigned-urls.html
- S3 CORS Configuration: https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html
