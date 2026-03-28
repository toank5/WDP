# Authentication - Implementation Guide

## Overview
The Authentication feature handles user registration, login, email verification, password reset, and JWT-based session management with role-based access control.

## Feature Scope
### Operations
| Operation | Description | Endpoint | Public? |
|-----------|-------------|----------|---------|
| **Login** | User login with email/password | `POST /auth/login` | ✅ Yes |
| **Register** | New user registration | `POST /auth/register` | ✅ Yes |
| **Verify Email** | Verify email with token | `POST /auth/verify-email` | ✅ Yes |
| **Forgot Password** | Request password reset | `POST /auth/forgot-password` | ✅ Yes |
| **Reset Password** | Reset password with token | `POST /auth/reset-password` | ✅ Yes |
| **Resend Verification** | Resend verification email | `POST /auth/resend-verification` | ✅ Yes |
| **Refresh Token** | Refresh access token | `POST /auth/refresh-token` | ✅ Yes |
| **Logout** | Invalidate session | `POST /auth/logout` | ❌ No |

## Database Schema
### Key Entities

**User** - Located at `wdp-be/src/user/entities/user.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `email` | string | Unique email address |
| `passwordHash` | string | Bcrypt hashed password |
| `fullName` | string | User's full name |
| `phone` | string | Phone number |
| `avatar` | string | Avatar URL |
| `role` | UserRole | ADMIN, MANAGER, OPERATION, SALE, CUSTOMER |
| `status` | UserStatus | REGISTERED, UNVERIFIED, VERIFIED, ACTIVE, SUSPENDED, LOCKED, PASSWORD_RESET |
| `addresses` | Address[] | User addresses |
| `preferences` | UserPreferences | User preferences |
| `verificationToken` | string | Email verification token |
| `verificationExpires` | Date | Token expiry (24h) |
| `verifiedAt` | Date | Verification timestamp |
| `resetToken` | string | Password reset token (hashed) |
| `resetExpires` | Date | Reset token expiry (1h) |
| `passwordChangedAt` | Date | Last password change |
| `failedAttempts` | number | Failed login attempts |
| `lastLoginAt` | Date | Last successful login |
| `lockedAt` | Date | Account lock timestamp |
| `createdAt` | Date | Account creation |
| `updatedAt` | Date | Last update |

**Relationships:**
- `addresses` → Address[] (One-to-Many)

**Address** - Located at `wdp-be/src/user/entities/address.entity.ts`
| Property | Type | Description |
|----------|------|-------------|
| `id` | string (UUID) | Primary key |
| `userId` | string (UUID) | Foreign key to User |
| `fullName` | string | Recipient name |
| `phone` | string | Recipient phone |
| `address` | string | Street address |
| `city` | string | City |
| `district` | string | District |
| `ward` | string | Ward |
| `isDefault` | boolean | Default address flag |

## DTOs
### LoginRequestDto
Located at `wdp-be/src/commons/dtos/auth.dto.ts`
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Email format |
| `password` | string | Yes | Min 8 chars |

### RegisterUserDto
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `email` | string | Yes | Unique, Email format |
| `password` | string | Yes | Min 8, 1 uppercase, 1 number, 1 special |
| `fullName` | string | Yes | Min 2 chars |
| `phone` | string | No | Phone format |

### VerifyEmailDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Verification token |

### ForgotPasswordDto
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |

### ResetPasswordDto
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `token` | string | Yes | Reset token |
| `newPassword` | string | Yes | Min 8, 1 uppercase, 1 number, 1 special |

### LoginResponseDto
| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string | JWT token (15 min expiry) |
| `refreshToken` | string | Refresh token (7 days expiry) |
| `user` | UserResponseDto | User info |

## API Endpoints
### POST /auth/login
**Description**: Authenticate user and receive JWT tokens

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE"
  }
}
```

**Errors**:
- 401 UNAUTHORIZED: Invalid credentials
- 403 FORBIDDEN: Account not verified, locked, or suspended

### POST /auth/register
**Description**: Register new user account

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "fullName": "Jane Doe",
  "phone": "0123456789"
}
```

**Response** (201 CREATED):
```json
{
  "message": "Registration successful. Please check your email to verify your account."
}
```

### POST /auth/verify-email
**Description**: Verify email address with token

**Request**:
```json
{
  "token": "verification_token_from_email"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "message": "Email verified successfully"
}
```

### POST /auth/forgot-password
**Description**: Request password reset link

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "If email exists, password reset link has been sent"
}
```

**Note**: Always returns 200 to prevent email enumeration

### POST /auth/reset-password
**Description**: Reset password with token

**Request**:
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successful. Please login with your new password."
}
```

## Implementation Requirements
### 1. Controller Implementation
Located at `wdp-be/src/controllers/auth.controller.ts`

**Required Methods:**
- `login()` - Validate credentials, return JWT tokens
- `register()` - Create user, send verification email
- `verifyEmail()` - Verify token, activate account
- `forgotPassword()` - Send reset email (always return success)
- `resetPassword()` - Verify token, update password
- `resendVerification()` - Resend verification email
- `refreshToken()` - Generate new access token
- `logout()` - Invalidate refresh token

### 2. Service Implementation
Located at `wdp-be/src/services/auth.service.ts`

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

**Token Configuration:**
| Token | Expiry | Purpose |
|-------|--------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Token refresh |
| Verification Token | 24 hours | Email verification |
| Reset Token | 1 hour | Password reset |

**Security Measures:**
- Password hashing with bcrypt (10 rounds)
- Rate limiting on login (5 attempts per 15 min)
- Account lock after 5 failed attempts
- Token hashing before database storage
- Secure password reset flow

### 3. Email Templates
**Verification Email:**
```
Subject: Verify your WDP account

Hi {{fullName}},

Please verify your email by clicking the link below:
{{verificationUrl}}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.
```

**Password Reset Email:**
```
Subject: Reset your WDP password

Hi {{fullName}},

Click the link below to reset your password:
{{resetUrl}}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.
```

### 4. JWT Strategy
Located at `wdp-be/src/strategies/jwt.strategy.ts`

**Payload Structure:**
```typescript
{
  sub: userId,
  email: userEmail,
  role: userRole,
  iat: issuedAt,
  exp: expiresAt
}
```

### 5. Role-Based Access Control
| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access |
| **MANAGER** | Manage products, orders, users, reports |
| **OPERATION** | Process orders, manage inventory |
| **SALE** | View orders, process returns |
| **CUSTOMER** | Browse, shop, manage own orders |

### 6. State Transitions
| From | To | Trigger |
|------|-----|---------|
| REGISTERED | UNVERIFIED | Account created |
| UNVERIFIED | VERIFIED | Email link clicked |
| UNVERIFIED | REGISTERED | Token expired (resubmit) |
| VERIFIED | ACTIVE | First login |
| ACTIVE | PASSWORD_RESET | Password reset requested |
| PASSWORD_RESET | ACTIVE | Password changed |
| ACTIVE | SUSPENDED | Admin action |
| ACTIVE | LOCKED | 5 failed logins |
| SUSPENDED | ACTIVE | Admin action |
| LOCKED | ACTIVE | Admin unlock |

## Diagrams
- State Machine: `diagrams/state-machine/user-auth.state.puml`
- Sequence Diagrams:
  - Login: `diagrams/details/authentication/sequence-login.puml`
  - Register: `diagrams/details/authentication/sequence-register.puml`
  - Verify Email: `diagrams/details/authentication/sequence-verify-email.puml`
  - Password Reset: `diagrams/details/authentication/sequence-password-reset.puml`
- Class Diagram: `diagrams/details/authentication/class-diagram.puml`

## Error Handling
| Status Code | Scenario |
|-------------|----------|
| 400 | Invalid input, weak password, token expired |
| 401 | Invalid credentials |
| 403 | Account locked, suspended, or not verified |
| 409 | Email already exists |
| 429 | Too many requests (rate limit) |
| 500 | Email service error, database error |

## Security Considerations
1. **Password Storage**: Never store plain passwords, use bcrypt
2. **Token Security**: Hash tokens before storing in database
3. **Rate Limiting**: Implement on login and registration endpoints
4. **Email Enumeration**: Always return same message for forgot-password
5. **Session Management**: Invalidate all sessions on password change
6. **HTTPS**: Always use HTTPS in production
7. **CORS**: Configure proper CORS headers
