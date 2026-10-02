# API Documentation

Base URL: `http://localhost:5000/api` (also available under `/api/v1`).

## Conventions

- **Authentication:** protected routes need `Authorization: Bearer <token>`. Use the `token` returned by login.
- **Content type:** JSON bodies use `Content-Type: application/json`. Uploads use `multipart/form-data`.
- **Errors:** failures return `{ "success": false, "message": "..." }` with an appropriate status code. Missing or invalid tokens return `401`. An invalid MongoDB id (for example `resumeId`) returns `400`.
- **Ownership:** every resource is scoped to the signed-in user. Requesting another user's resume, job or result returns `404`.

---

## Authentication

### POST /api/auth/signup
Register a new user (`POST /api/auth/register` is an alias). A verification email is sent; the link expires in 1 hour.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```
- `password` must be at least 8 characters. `phone` is not accepted yet.
- **201:** `{ success, message, token, user: { id, email, name, subscriptionTier, emailVerified } }`
- **400** validation error, **409** email already registered.

### POST /api/auth/login
```json
{
  "email": "john@example.com",
  "password": "secure_password"
}
```
- **200:** `{ success, message, token, refreshToken, user }`
- **401** invalid email or password, **403** email not verified.

### POST /api/auth/refresh-token
Get a new access token using a refresh token (valid for 30 days).
```json
{ "refreshToken": "string" }
```
- **200:** `{ success, message, token }`
- **401** invalid or expired refresh token.

### POST /api/auth/logout
Revokes the refresh token.
```json
{ "refreshToken": "string" }
```
- **200** on success, **401** invalid token.

### GET /api/auth/verify-email?token=... &nbsp;/&nbsp; POST /api/auth/verify-email
Verify an email address. The token comes from the verification email, as a query parameter or in the body (`{ "token": "..." }`).
- **200** verified, **400** invalid token, **410** token expired.

### POST /api/auth/request-reset-password
Sends a reset link if the account exists. Always returns **200** so account existence isn't revealed.
```json
{ "email": "john@example.com" }
```

### POST /api/auth/reset-password
```json
{
  "token": "string",
  "newPassword": "new_secure_password"
}
```
- **200** password reset (existing sessions are signed out), **400** invalid token or password under 8 characters, **410** token expired.

### GET /api/auth/me
Current user's profile. Requires `Authorization`.
- **200:** `{ success, message, data: { user } }`

---

## Resumes

### POST /api/resumes/upload
Upload a resume (PDF or DOCX, max 5MB). Text is extracted, saved, and sent to the AI service for parsing.
- Header: `Authorization: Bearer <token>`
- Body: `multipart/form-data` with file field `resume`
- **201:**
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "parsed": true,
  "resume": { "id": "...", "fileName": "cv.pdf", "fileType": "pdf", "fileSize": 48213, "uploadedAt": "..." }
}
```
`parsed` is `false` if the AI service was unavailable; the resume is still saved.
- **400** no file or wrong type. **413** file over 5MB. **422** no readable text in the file.

### GET /api/resumes
All of the user's resumes, newest first (without the raw text).
- **200:** `{ success, resumes: [...] }`

### GET /api/resumes/:resumeId
One resume, including `originalContent` (raw text) and `parsedData` (name, email, phone, skills, experiences, education, certifications).
- **200:** `{ success, resume }` — **404** not found, **403** not yours.

### DELETE /api/resumes/:resumeId
Deletes the resume and any tailored results generated from it.
- **200:** `{ success, message }`

---

## Jobs

### POST /api/jobs/upload
Upload a job description (PDF or DOCX, max 5MB).
- Header: `Authorization: Bearer <token>`
- Body: `multipart/form-data` with file field `job` and text fields `jobTitle` and `company` (both required).
- **201:** `{ success, message, jobId, jobTitle, company, fileName, fileSize, uploadedAt }`
- **400** missing fields, wrong file type, or no readable text in the file (the message says which). **413** file over 5MB.

### GET /api/jobs
All of the user's jobs, newest first (without the raw text).
- **200:** `{ success, message, count, data: [...] }`

### GET /api/jobs/:jobId
- **200:** `{ success, message, data }` (includes `rawContent`) — **404** not found.

### DELETE /api/jobs/:jobId
- **200:** `{ success, message, jobId }`

---

## Generated Resumes (AI)

### POST /api/generated-resumes/tailor
Match a resume against a job, then generate AI suggestions with Claude. Requires `ANTHROPIC_API_KEY` on the server.
- Header: `Authorization: Bearer <token>`
- Body:
```json
{
  "resumeId": "60f7b3c4d8f8e9a0b1c2d3e4",
  "jobId": "60f7b3c4d8f8e9a0b1c2d3e5"
}
```
- **201:**
```json
{
  "success": true,
  "message": "Tailored resume generated successfully",
  "data": {
    "generatedResumeId": "...",
    "matchScore": 50,
    "strengths": "Moderate match. ...",
    "improvements": "Add experience with: postgresql, kubernetes",
    "recommendations": ["Learn these missing skills: postgresql, kubernetes"],
    "exactMatches": ["python", "fastapi"],
    "skillGaps": ["postgresql", "kubernetes"],
    "suggestions": [
      { "category": "skills", "priority": "high", "title": "Learn Kubernetes", "description": "...", "example": "..." }
    ],
    "tailoredBullets": ["..."],
    "coverLetterSnippet": "..."
  }
}
```
- **400** missing or invalid ids, **404** resume or job not found, **429** AI service rate-limited, **503** AI not configured (missing or invalid API key).

`matchScore` is the share of the job's required skills found in the resume (0-100).

### GET /api/generated-resumes
All results, newest first (without the detailed `suggestions`).
- **200:** `{ success, message, count, data: [...] }`

### GET /api/generated-resumes/:generatedResumeId
Full result, including suggestions.
- **200:** `{ success, message, data }` — **404** not found.

### DELETE /api/generated-resumes/:generatedResumeId
- **200:** `{ success, message, generatedResumeId }`

---

## AI Service (internal)

The backend calls a Python service (default `http://localhost:5001`). It isn't meant for browsers, but its docs are at `/docs`.

- `POST /api/parse` — `{ "text": "..." }` → parsed resume (min 50 characters)
- `POST /api/parse-job` — `{ "text": "..." }` → parsed job description
- `GET /health`
