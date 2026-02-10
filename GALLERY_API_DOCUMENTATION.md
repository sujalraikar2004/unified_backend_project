# Gallery API Documentation

## Overview
The Gallery API provides endpoints to manage media content (images and videos) with features like categorization, tagging, search, and statistics.

## Base URL
```
/api/v1/gallery
```

---

## Endpoints

### 1. Create Gallery Item
**POST** `/api/v1/gallery/create`

Creates a new gallery item with image or video upload.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `media` (file, required): Image or video file to upload
- `title` (string, required): Title of the gallery item
- `description` (string, optional): Description of the item
- `mediaType` (string, required): Either "image" or "video"
- `category` (string, optional): Category name (default: "general")
- `tags` (string or array, optional): Comma-separated tags or array of tags

**Example Request:**
```javascript
const formData = new FormData();
formData.append('media', fileInput.files[0]);
formData.append('title', 'Beautiful Sunset');
formData.append('description', 'A stunning sunset from the beach');
formData.append('mediaType', 'image');
formData.append('category', 'nature');
formData.append('tags', 'sunset,beach,photography');

fetch('/api/v1/gallery/create', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: formData
});
```

**Success Response (201):**
```json
{
    "statusCode": 201,
    "data": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Beautiful Sunset",
        "description": "A stunning sunset from the beach",
        "mediaType": "image",
        "mediaUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "publicId": "gallery/xyz123",
        "category": "nature",
        "tags": ["sunset", "beach", "photography"],
        "uploadedBy": "64f5a1b2c3d4e5f6a7b8c9d1",
        "isActive": true,
        "viewCount": 0,
        "metadata": {
            "width": 1920,
            "height": 1080,
            "format": "jpg",
            "size": 245678
        },
        "createdAt": "2024-03-15T10:30:00.000Z",
        "updatedAt": "2024-03-15T10:30:00.000Z"
    },
    "message": "Gallery item created successfully",
    "success": true
}
```

---

### 2. Get All Gallery Items
**GET** `/api/v1/gallery/`

Retrieves all gallery items with filtering, search, and pagination.

**Authentication:** Not Required

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `category` (string, optional): Filter by category (use "all" for no filter)
- `mediaType` (string, optional): Filter by "image" or "video" (use "all" for no filter)
- `search` (string, optional): Text search in title, description, and tags
- `sortBy` (string, optional): Sort field (default: "createdAt")
- `sortOrder` (string, optional): "asc" or "desc" (default: "desc")
- `isActive` (boolean, optional): Filter by active status (default: true)

**Example Request:**
```
GET /api/v1/gallery/?page=1&limit=12&category=nature&mediaType=image&search=sunset&sortBy=viewCount&sortOrder=desc
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {
        "galleryItems": [
            {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
                "title": "Beautiful Sunset",
                "description": "A stunning sunset from the beach",
                "mediaType": "image",
                "mediaUrl": "https://res.cloudinary.com/...",
                "thumbnailUrl": "https://res.cloudinary.com/...",
                "category": "nature",
                "tags": ["sunset", "beach", "photography"],
                "viewCount": 125,
                "uploadedBy": {
                    "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
                    "fullName": "John Doe",
                    "email": "john@example.com"
                },
                "createdAt": "2024-03-15T10:30:00.000Z"
            }
        ],
        "pagination": {
            "currentPage": 1,
            "totalPages": 5,
            "totalItems": 48,
            "itemsPerPage": 10,
            "hasNextPage": true,
            "hasPrevPage": false
        }
    },
    "message": "Gallery items retrieved successfully",
    "success": true
}
```

---

### 3. Get Gallery Item By ID
**GET** `/api/v1/gallery/:id`

Retrieves a single gallery item by its ID and increments view count.

**Authentication:** Not Required

**URL Parameters:**
- `id` (string, required): Gallery item ID

**Example Request:**
```
GET /api/v1/gallery/64f5a1b2c3d4e5f6a7b8c9d0
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Beautiful Sunset",
        "description": "A stunning sunset from the beach",
        "mediaType": "image",
        "mediaUrl": "https://res.cloudinary.com/...",
        "thumbnailUrl": "https://res.cloudinary.com/...",
        "publicId": "gallery/xyz123",
        "category": "nature",
        "tags": ["sunset", "beach", "photography"],
        "uploadedBy": {
            "_id": "64f5a1b2c3d4e5f6a7b8c9d1",
            "fullName": "John Doe",
            "email": "john@example.com"
        },
        "isActive": true,
        "viewCount": 126,
        "metadata": {
            "width": 1920,
            "height": 1080,
            "format": "jpg",
            "size": 245678
        },
        "createdAt": "2024-03-15T10:30:00.000Z",
        "updatedAt": "2024-03-15T10:35:00.000Z"
    },
    "message": "Gallery item retrieved successfully",
    "success": true
}
```

---

### 4. Update Gallery Item
**PATCH** `/api/v1/gallery/update/:id`

Updates an existing gallery item. Can update metadata and/or replace the media file.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**URL Parameters:**
- `id` (string, required): Gallery item ID

**Form Data:**
- `media` (file, optional): New image or video file to replace existing one
- `title` (string, optional): New title
- `description` (string, optional): New description
- `category` (string, optional): New category
- `tags` (string or array, optional): New tags
- `isActive` (boolean, optional): Active status

**Example Request:**
```javascript
const formData = new FormData();
formData.append('title', 'Updated Title');
formData.append('description', 'Updated description');
formData.append('category', 'landscapes');
formData.append('tags', 'updated,nature,beautiful');
formData.append('isActive', true);
// Optionally add new media file
// formData.append('media', newFileInput.files[0]);

fetch('/api/v1/gallery/update/64f5a1b2c3d4e5f6a7b8c9d0', {
    method: 'PATCH',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    },
    body: formData
});
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "title": "Updated Title",
        "description": "Updated description",
        "mediaType": "image",
        "mediaUrl": "https://res.cloudinary.com/...",
        "category": "landscapes",
        "tags": ["updated", "nature", "beautiful"],
        "isActive": true,
        "viewCount": 126,
        "createdAt": "2024-03-15T10:30:00.000Z",
        "updatedAt": "2024-03-15T11:00:00.000Z"
    },
    "message": "Gallery item updated successfully",
    "success": true
}
```

---

### 5. Delete Gallery Item
**DELETE** `/api/v1/gallery/delete/:id`

Deletes a gallery item and removes the media from cloud storage.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <token>
```

**URL Parameters:**
- `id` (string, required): Gallery item ID

**Example Request:**
```javascript
fetch('/api/v1/gallery/delete/64f5a1b2c3d4e5f6a7b8c9d0', {
    method: 'DELETE',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
    }
});
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {},
    "message": "Gallery item deleted successfully",
    "success": true
}
```

---

### 6. Get Gallery Categories
**GET** `/api/v1/gallery/categories`

Retrieves all unique categories used in the gallery.

**Authentication:** Not Required

**Example Request:**
```
GET /api/v1/gallery/categories
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": [
        "general",
        "nature",
        "landscapes",
        "events",
        "sports",
        "technology"
    ],
    "message": "Categories retrieved successfully",
    "success": true
}
```

---

### 7. Get Gallery Statistics
**GET** `/api/v1/gallery/stats`

Retrieves comprehensive statistics about the gallery.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <token>
```

**Example Request:**
```
GET /api/v1/gallery/stats
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {
        "totalItems": 150,
        "activeItems": 145,
        "inactiveItems": 5,
        "imageCount": 120,
        "videoCount": 30,
        "totalViews": 15847,
        "categoryCounts": [
            { "_id": "nature", "count": 45 },
            { "_id": "events", "count": 38 },
            { "_id": "sports", "count": 27 },
            { "_id": "general", "count": 20 }
        ],
        "recentItems": [
            {
                "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
                "title": "Recent Upload",
                "mediaType": "image",
                "category": "nature",
                "viewCount": 12,
                "createdAt": "2024-03-15T10:30:00.000Z"
            }
        ]
    },
    "message": "Gallery statistics retrieved successfully",
    "success": true
}
```

---

### 8. Bulk Delete Gallery Items
**POST** `/api/v1/gallery/bulk-delete`

Deletes multiple gallery items at once.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
    "ids": [
        "64f5a1b2c3d4e5f6a7b8c9d0",
        "64f5a1b2c3d4e5f6a7b8c9d1",
        "64f5a1b2c3d4e5f6a7b8c9d2"
    ]
}
```

**Example Request:**
```javascript
fetch('/api/v1/gallery/bulk-delete', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        ids: ['64f5a1b2c3d4e5f6a7b8c9d0', '64f5a1b2c3d4e5f6a7b8c9d1']
    })
});
```

**Success Response (200):**
```json
{
    "statusCode": 200,
    "data": {
        "deletedCount": 2
    },
    "message": "2 gallery items deleted successfully",
    "success": true
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request:**
```json
{
    "statusCode": 400,
    "message": "Title and media type are required",
    "success": false,
    "errors": []
}
```

**401 Unauthorized:**
```json
{
    "statusCode": 401,
    "message": "Unauthorized request",
    "success": false,
    "errors": []
}
```

**404 Not Found:**
```json
{
    "statusCode": 404,
    "message": "Gallery item not found",
    "success": false,
    "errors": []
}
```

**500 Internal Server Error:**
```json
{
    "statusCode": 500,
    "message": "Failed to upload media to cloud storage",
    "success": false,
    "errors": []
}
```

---

## Data Models

### Gallery Item Schema
```javascript
{
    title: String (required, indexed),
    description: String,
    mediaType: String (enum: ["image", "video"], required),
    mediaUrl: String (required),
    thumbnailUrl: String,
    publicId: String (required),
    category: String (default: "general"),
    tags: [String],
    uploadedBy: ObjectId (ref: User),
    isActive: Boolean (default: true),
    viewCount: Number (default: 0),
    metadata: {
        width: Number,
        height: Number,
        format: String,
        size: Number,
        duration: Number (for videos)
    },
    createdAt: Date,
    updatedAt: Date
}
```

---

## Features

### 1. **Dynamic Media Upload**
- Support for both images and videos
- Automatic cloud storage integration (Cloudinary)
- Thumbnail generation
- Metadata extraction (dimensions, format, size, duration)

### 2. **Categorization & Tagging**
- Custom categories
- Multiple tags per item
- Category listing endpoint

### 3. **Search & Filtering**
- Full-text search across title, description, and tags
- Filter by category
- Filter by media type
- Filter by active status

### 4. **Pagination**
- Configurable page size
- Page navigation info
- Total count tracking

### 5. **Sorting**
- Sort by any field
- Ascending/descending order
- Default: newest first

### 6. **View Tracking**
- Automatic view count increment
- View statistics

### 7. **Statistics Dashboard**
- Total items count
- Active/inactive breakdown
- Media type distribution
- Category distribution
- Total views
- Recent items

### 8. **Bulk Operations**
- Bulk delete functionality
- Easy content management

---

## Usage Examples

### Frontend Integration Example (React)

```javascript
// Upload gallery item
const uploadGalleryItem = async (file, data) => {
    const formData = new FormData();
    formData.append('media', file);
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('mediaType', data.mediaType);
    formData.append('category', data.category);
    formData.append('tags', data.tags.join(','));

    const response = await fetch('/api/v1/gallery/create', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    return await response.json();
};

// Fetch gallery items with filters
const fetchGalleryItems = async (filters) => {
    const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 12,
        category: filters.category || 'all',
        mediaType: filters.mediaType || 'all',
        search: filters.search || '',
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc'
    });

    const response = await fetch(`/api/v1/gallery/?${params}`);
    return await response.json();
};

// Get single item
const getGalleryItem = async (id) => {
    const response = await fetch(`/api/v1/gallery/${id}`);
    return await response.json();
};
```

---

## Notes

1. **File Size Limits**: Ensure your server and Cloudinary account support the file sizes you plan to upload
2. **Supported Formats**: 
   - Images: JPG, PNG, GIF, WebP, SVG
   - Videos: MP4, WebM, MOV, AVI
3. **Authentication**: Most write operations require valid JWT token
4. **Rate Limiting**: Consider implementing rate limiting for upload endpoints
5. **Storage**: Media files are stored in Cloudinary, not on your server
6. **Cleanup**: Local temporary files are automatically cleaned up after upload

---

## Best Practices

1. Always validate file types on the frontend before upload
2. Compress large images before uploading
3. Use appropriate categories and tags for better organization
4. Implement pagination on the frontend to handle large galleries
5. Cache gallery listings when possible
6. Use thumbnails for gallery grid views
7. Implement lazy loading for better performance
8. Handle errors gracefully with user-friendly messages
