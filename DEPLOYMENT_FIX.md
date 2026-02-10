# MongoDB Connection Timeout Fix for Vercel Deployment

## Problem
The application was experiencing `Operation 'users.findOne()' buffering timed out after 10000ms` error in production (Vercel) while working fine in localhost.

## Root Cause
Serverless functions on Vercel have unique characteristics:
1. **Cold starts**: Each request may start a new function instance
2. **Connection pooling issues**: MongoDB connections weren't being properly cached
3. **Buffering problems**: Mongoose was buffering commands before DB connection was established
4. **Timing issues**: DB connection wasn't guaranteed before queries executed

## Fixes Applied

### 1. Enhanced Database Connection (`src/db/db.js`)
- ✅ Added connection state management to prevent multiple simultaneous connections
- ✅ Implemented connection caching with proper state checking
- ✅ Disabled command buffering for serverless (`bufferCommands: false`)
- ✅ Optimized connection pool settings:
  - `maxPoolSize: 10` - Maximum connections
  - `minPoolSize: 1` - Keep at least one connection alive
  - `serverSelectionTimeoutMS: 10000` - Increased timeout
  - `connectTimeoutMS: 10000` - Connection timeout
- ✅ Created `ensureDbConnection` middleware to guarantee DB connectivity before each request
- ✅ Added connection locking to prevent race conditions

### 2. Application Setup (`src/app.js`)
- ✅ Imported and applied `ensureDbConnection` middleware before all API routes
- ✅ Moved health check routes before DB middleware for quick status checks
- ✅ Enhanced health endpoint to report database connection state

### 3. Server Configuration (`src/index.js`)
- ✅ Disabled global command buffering: `mongoose.set('bufferCommands', false)`
- ✅ Changed Vercel mode to rely on per-request connection via middleware
- ✅ Removed problematic startup connection in serverless mode
- ✅ Added proper error handling and process exit on local dev failures

## MongoDB Connection Options Explained

```javascript
{
  maxPoolSize: 10,              // Max connections (good for concurrent requests)
  minPoolSize: 1,               // Keep 1 connection alive (reduces cold starts)
  serverSelectionTimeoutMS: 10000,  // 10s to find MongoDB server
  socketTimeoutMS: 45000,       // 45s for long operations
  connectTimeoutMS: 10000,      // 10s to establish connection
  bufferCommands: false,        // Don't buffer, fail fast if no connection
  autoIndex: true,              // Ensure indexes are created
}
```

## Deployment Checklist

Before deploying to Vercel, ensure:

1. **Environment Variables** are set in Vercel dashboard:
   - `MONGODB_URL` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `JWT_EXPIRE` - Token expiration time
   - `CORS_ORIGIN` - Your frontend URL
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAIL_USER`, `EMAIL_PASS` - For nodemailer
   - `NODE_ENV=production`

2. **MongoDB Atlas Settings**:
   - ✅ Add `0.0.0.0/0` to IP whitelist (Vercel uses dynamic IPs)
   - ✅ Or use Vercel-specific IP ranges if available
   - ✅ Ensure MongoDB user has proper read/write permissions
   - ✅ Use MongoDB Atlas M10+ tier for better performance

3. **Vercel Configuration**:
   - ✅ `vercel.json` is properly configured
   - ✅ Function region matches MongoDB region (reduces latency)
   - ✅ Function timeout set appropriately (default 10s, max 60s on Pro)

## Testing After Deployment

1. **Check Basic Connectivity**:
   ```bash
   curl https://your-app.vercel.app/
   curl https://your-app.vercel.app/health
   ```

2. **Test Database Connection**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"yourpassword"}'
   ```

3. **Monitor Vercel Logs**:
   - Check function logs in Vercel dashboard
   - Look for "Using cached database connection" messages
   - Verify no timeout errors

## Additional Recommendations

### For Better Performance:
1. **Use MongoDB Atlas in same region as Vercel deployment**
2. **Upgrade to Vercel Pro** for longer function timeouts if needed
3. **Consider Redis for session management** to reduce DB calls
4. **Add response caching** for frequently accessed data
5. **Monitor cold start times** and optimize if needed

### For Debugging:
1. **Enable detailed logging** in production (temporarily):
   ```javascript
   mongoose.set('debug', true);
   ```

2. **Check MongoDB Atlas metrics**:
   - Connection count
   - Operation latency
   - Network traffic

3. **Vercel Function Logs**:
   - Check for cold starts
   - Monitor execution time
   - Watch for memory issues

## Common Issues & Solutions

### Issue: Still getting timeout errors
**Solution**: 
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check if MongoDB connection string is correct in Vercel env vars
- Ensure MongoDB cluster is not paused (free tier auto-pauses)

### Issue: Works first time, fails on subsequent requests
**Solution**:
- Connection pooling might be exhausted
- Check `maxPoolSize` setting
- Monitor active connections in MongoDB Atlas

### Issue: Slow response times
**Solution**:
- Deploy Vercel function in same region as MongoDB
- Use connection pooling (already configured)
- Add database indexes for queried fields

## Files Modified

1. ✅ `src/db/db.js` - Enhanced connection management
2. ✅ `src/app.js` - Added DB middleware
3. ✅ `src/index.js` - Updated serverless configuration

## Next Steps

1. **Deploy to Vercel**: `vercel --prod`
2. **Test all endpoints** especially auth routes
3. **Monitor logs** for 24 hours to ensure stability
4. **Set up alerts** in Vercel for function errors
5. **Consider adding APM tool** like Sentry for error tracking

## Support

If issues persist:
1. Check Vercel function logs
2. Verify MongoDB Atlas connection logs
3. Test with Postman/curl to isolate frontend issues
4. Enable mongoose debug mode temporarily
5. Check network latency between Vercel and MongoDB Atlas

---
**Date Fixed**: February 10, 2026
**Status**: ✅ Ready for deployment
