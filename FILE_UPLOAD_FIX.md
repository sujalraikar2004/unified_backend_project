# File Upload Fix for Production (Vercel)

## Problem
The original multer configuration used `./public/temp` directory for storing temporary files before uploading to Cloudinary. This approach fails in production on Vercel because:

1. **Serverless functions have no persistent file system** - Files stored in regular directories are lost between invocations
2. **Limited write permissions** - Only `/tmp` directory is writable in Vercel's serverless environment
3. **Directory doesn't exist** - The `public/temp` directory isn't created automatically in production

## Solution

### 1. Updated Multer Middleware ([src/middlewares/multer.middleware.js](src/middlewares/multer.middleware.js))

**Key Changes:**
- ✅ **Dynamic temp directory selection** - Uses `/tmp` in production (Vercel), `public/temp` in development
- ✅ **Automatic directory creation** - Creates `public/temp` if it doesn't exist in local development
- ✅ **Environment detection** - Checks `VERCEL` or `NODE_ENV` environment variables
- ✅ **File extension preservation** - Keeps original file extensions for better compatibility
- ✅ **File size limits** - 10MB upload limit to prevent abuse
- ✅ **File type validation** - Only allows images (JPEG, PNG, GIF, WebP) and videos (MP4, MPEG, MOV)

**Code Changes:**
```javascript
// Before (❌ Fails in production)
destination: function (req, file, cb) {
    cb(null, './public/temp')
}

// After (✅ Works everywhere)
const getTempDir = () => {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        return '/tmp'; // Vercel's writable directory
    }
    return path.join(process.cwd(), 'public', 'temp'); // Local dev
};
```

### 2. Enhanced Cloudinary Utility ([src/utils/cloudinary.js](src/utils/cloudinary.js))

**Improvements:**
- ✅ **File existence validation** - Checks if file exists before upload attempt
- ✅ **Better error messages** - More descriptive errors for debugging
- ✅ **Enhanced logging** - Shows file path, environment, and upload status
- ✅ **Robust cleanup** - Ensures temp files are deleted even if errors occur
- ✅ **Try-catch for cleanup** - Prevents cleanup errors from breaking the upload flow

**Added Logging:**
- File path and existence check
- Environment detection (Vercel vs Local)
- Upload progress and success/failure
- Cleanup status

---

## How It Works

### Production (Vercel) Flow:
1. **Client uploads file** → Multer receives it
2. **Multer saves to `/tmp/`** → Only writable directory in serverless
3. **Cloudinary upload** → File uploaded from `/tmp/filename`
4. **Cleanup** → File deleted from `/tmp/` to free space
5. **Response** → Cloudinary URL returned to client

### Development (Local) Flow:
1. **Client uploads file** → Multer receives it
2. **Multer saves to `public/temp/`** → Created if doesn't exist
3. **Cloudinary upload** → File uploaded from `public/temp/filename`
4. **Cleanup** → File deleted from `public/temp/`
5. **Response** → Cloudinary URL returned to client

---

## Testing

### Test Locally:
```bash
cd /home/sujal/Desktop/unified_project/unified_backend

# Start local server
npm run dev

# Test file upload (use Postman or your frontend)
# POST /api/v1/gallery/create
# POST /api/v1/events (with posterImage)
```

### Test in Production:
```bash
# Deploy to Vercel
vercel --prod

# Test file upload through your deployed API
curl -X POST https://unified-backend-project.vercel.app/api/v1/gallery/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "media=@/path/to/image.jpg" \
  -F "title=Test Image" \
  -F "category=test"
```

---

## Environment Variables

Ensure these are set in Vercel dashboard:

```env
CLOUDINARY_CLOUD_NAME=derz8ikfc
CLOUDINARY_API_KEY=561939495576736
CLOUDINARY_API_SECRET=k0ZD40fMhllYhoqqmhJXwPoKKgU
NODE_ENV=production
```

---

## Features Added

### File Upload Security:
- ✅ File size limit: **10MB maximum**
- ✅ File type validation: **Only images and videos allowed**
- ✅ Unique filenames: **Prevents overwrites**
- ✅ Automatic cleanup: **No orphaned files**

### Supported File Types:
**Images:**
- JPEG/JPG
- PNG
- GIF
- WebP

**Videos:**
- MP4
- MPEG
- MOV (QuickTime)

---

## Endpoints Using File Upload

1. **Create Event** - `POST /api/v1/events`
   - Field: `posterImage`
   - Type: Single image
   - Optional

2. **Update Event** - `PUT /api/v1/events/:eventId`
   - Field: `posterImage`
   - Type: Single image
   - Optional

3. **Create Gallery Item** - `POST /api/v1/gallery/create`
   - Field: `media`
   - Type: Single image or video
   - Required

4. **Update Gallery Item** - `PATCH /api/v1/gallery/update/:id`
   - Field: `media`
   - Type: Single image or video
   - Optional

---

## Error Handling

### Common Errors & Solutions:

**"File not found at path"**
- Cause: Multer didn't save the file properly
- Solution: Check write permissions on `/tmp` (should work by default on Vercel)

**"Invalid file type"**
- Cause: Unsupported file format uploaded
- Solution: Only upload JPEG, PNG, GIF, WebP, MP4, MPEG, or MOV files

**"File too large"**
- Cause: File exceeds 10MB limit
- Solution: Compress the file or increase the limit in multer config

**"Cloudinary upload error"**
- Cause: Invalid Cloudinary credentials or network issue
- Solution: Verify credentials in environment variables

---

## Monitoring

Check Vercel logs for upload debug info:
```bash
vercel logs --prod
```

Look for these log messages:
- `Cloudinary Upload Debug:`
- `✅ File uploaded to cloudinary:`
- `✅ Temporary file cleaned up:`
- `❌ Cloudinary upload error:`

---

## Benefits

✅ **Production-ready** - Works seamlessly on Vercel serverless  
✅ **Development-friendly** - Still works great locally  
✅ **Automatic cleanup** - No disk space issues  
✅ **Better error handling** - Clear error messages for debugging  
✅ **Security enhanced** - File validation and size limits  
✅ **Type safety** - File extension preservation  

---

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Test file uploads in production
3. ✅ Monitor logs for any issues
4. ✅ Update frontend if needed (should work without changes)

Your file upload system is now **production-ready**! 🚀
