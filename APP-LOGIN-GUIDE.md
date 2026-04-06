# App Usage and Login Guide

This guide explains how to use the Finance Dashboard and how to log in as Admin, Analyst, or Viewer.

## 1. Open the App

Use your deployed frontend URL.

Example from current config:

- https://finance-app-one-zeta.vercel.app

## 2. Login Roles

The system has 3 roles:

- Admin
- Analyst
- Viewer (regular user)

## 3. Demo Login Credentials

Use these credentials if they exist in your database and demo accounts are seeded.

### Admin

- Email: admin@fin.com
- Password: Admin@123

### Analyst

- Email: analyst@fin.dev
- Password: Analyst123@

### Viewer (User)


- Register a new account.

## 4. OTP Step

After entering email and password, OTP verification is required.

- If test OTP mode is enabled on backend:
  - OTP: 123456
- If test OTP mode is disabled (real production mode):
  - Use the OTP received via email/SMS.

Backend variables controlling this:

- OTP_EMAIL_TEST_MODE
- OTP_SMS_TEST_MODE
- OTP_TEST_CODE

## 5. What Each Role Can Do

### Admin

- Manage users (create, update, delete, change role)
- Full access to records and analytics
- Full dashboard access

### Analyst

- View analytics and reports
- Create/read records (based on policy)
- Limited user visibility

### Viewer (User)

- Read-only access to own/personal data
- Basic dashboard access

## 6. If Login Fails

Check the following:

- Correct frontend URL and backend URL
- Account exists in production database
- Password is correct
- OTP mode matches expectation (test vs real)
- CORS and cookie settings are correct

## 7. Quick Production Notes

- `VITE_DEMO_MODE=true` only shows demo credentials in the UI.
- It does not create users in database.
- Real login always depends on users present in the backend database.
