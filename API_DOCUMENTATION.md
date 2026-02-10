# Authentication API Documentation

## Base URL
```
http://localhost:8000/api/v1/auth
```

## Endpoints

### 1. Register User
**Endpoint:** `POST /register`

**Description:** Register a new user account with email verification.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass@123",
  "usn": "1MS21CS001",
  "semester": "5",
  "department": "Computer Science"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Success Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "userId": "65f1a2b3c4d5e6f7g8h9i0j1",
    "email": "john.doe@example.com"
  },
  "message": "User registered successfully! Please check your email for verification OTP.",
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Missing fields or invalid password format
- `409 Conflict` - Email or USN already exists

---

### 2. Verify Email
**Endpoint:** `POST /verify-email`

**Description:** Verify user email with OTP sent during registration.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456"
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "email": "john.doe@example.com"
  },
  "message": "Email verified successfully! You can now login.",
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid or expired OTP
- `404 Not Found` - User not found

---

### 3. Resend OTP
**Endpoint:** `POST /resend-otp`

**Description:** Resend verification OTP to user email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "email": "john.doe@example.com"
  },
  "message": "OTP sent successfully! Please check your email.",
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Email already verified
- `404 Not Found` - User not found

---

### 4. Login
**Endpoint:** `POST /login`

**Description:** Login user and receive access & refresh tokens.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass@123"
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "usn": "1MS21CS001",
      "semester": "5",
      "department": "Computer Science",
      "isEmailVerified": true,
      "createdAt": "2026-02-05T00:00:00.000Z",
      "updatedAt": "2026-02-05T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

**Cookies Set:**
- `accessToken` (HTTP-only, expires in 5 days)
- `refreshToken` (HTTP-only, expires in 15 days)

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Email not verified
- `404 Not Found` - User not found

---

### 5. Logout (Protected)
**Endpoint:** `POST /logout`

**Description:** Logout user and clear tokens.

**Headers:**
```
Authorization: Bearer <accessToken>
```
Or send `accessToken` via cookies.

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing token

---

### 6. Forgot Password
**Endpoint:** `POST /forgot-password`

**Description:** Request password reset OTP via email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password reset OTP sent successfully! Please check your email.",
  "success": true
}
```

**Note:** For security, this endpoint always returns success even if the email doesn't exist.

---

### 7. Reset Password
**Endpoint:** `POST /reset-password`

**Description:** Reset password using OTP received via email.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass@123"
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password reset successfully! You can now login with your new password.",
  "success": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid OTP, expired OTP, or weak password
- `404 Not Found` - User not found

**Note:** All active sessions are invalidated after password reset.

---

### 8. Refresh Access Token
**Endpoint:** `POST /refresh-token`

**Description:** Get a new access token using refresh token.

**Request Body (or from cookies):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed",
  "success": true
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 9. Get Current User (Protected)
**Endpoint:** `GET /current-user`

**Description:** Get currently logged-in user details.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Success Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "usn": "1MS21CS001",
    "semester": "5",
    "department": "Computer Science",
    "isEmailVerified": true,
    "createdAt": "2026-02-05T00:00:00.000Z",
    "updatedAt": "2026-02-05T00:00:00.000Z"
  },
  "message": "User fetched successfully",
  "success": true
}
```

---

## Complete User Registration Flow

1. **Register** → `POST /register`
   - User provides all details
   - Receives OTP via email
   
2. **Verify Email** → `POST /verify-email`
   - User enters OTP from email
   - Account is activated
   
3. **Login** → `POST /login`
   - User can now login
   - Receives access & refresh tokens

## Complete Password Reset Flow

1. **Forgot Password** → `POST /forgot-password`
   - User provides email
   - Receives password reset OTP via email
   
2. **Reset Password** → `POST /reset-password`
   - User enters OTP and new password
   - Password is updated
   - All sessions are invalidated
   
3. **Login** → `POST /login`
   - User logs in with new password

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message here",
  "errors": []
}
```

## Notes

- **OTP Validity:** All OTPs expire after 10 minutes
- **Security:** Passwords are hashed using bcrypt with 10 salt rounds
- **Tokens:** Access tokens expire in 5 days, refresh tokens expire in 15 days
- **Cookies:** Tokens are stored in HTTP-only cookies for security
- **Email Verification:** Users must verify their email before they can login
- **Case Sensitivity:** Emails are stored in lowercase, USN is stored in uppercase
