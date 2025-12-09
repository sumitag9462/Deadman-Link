# Admin Security Guide

## Overview
This application implements a secure admin system to prevent unauthorized users from gaining administrative privileges.

## Admin Secret Key System

### How It Works
1. **Secret Key Requirement**: To register as an admin, users must provide a secret admin key during registration
2. **Environment Variable**: The secret key is stored in the server's `.env` file as `ADMIN_SECRET_KEY`
3. **Validation**: The backend validates the secret key before allowing admin account creation

### Setting Up Admin Access

#### 1. Configure the Secret Key
Edit `server/.env` and set a strong secret key:
```env
ADMIN_SECRET_KEY=YourSecureAdminKey123!@#
```

**Important**: 
- Use a complex, unpredictable key
- Only share this key with authorized administrators
- Change it periodically for security
- Never commit this key to version control

#### 2. Admin Registration Flow
1. Navigate to `/admin/register`
2. Fill in the registration form:
   - Name
   - Email
   - Password (min 8 characters)
   - **Admin Secret Key** (the key from your `.env` file)
3. Submit to receive OTP verification code
4. Verify email with OTP code
5. Admin account is created with `role: 'admin'`

#### 3. OAuth Admin Registration
For Google OAuth admin accounts:
- Currently creates admin accounts automatically if they don't exist
- **Recommendation**: Disable OAuth admin registration or add secret key verification to OAuth flow
- Edit `server/config/passport.js` to add security checks

### User Management

#### Admin Controls
Admins can manage users through the User Controls page (`/admin/users`):

- **View All Users**: Search and filter by name, email, role, or status
- **Change Roles**: Switch users between `user` and `admin` roles
- **Ban/Unban Users**: Prevent or restore user access
- **View Login History**: See when users last logged in
- **View Auth Provider**: See if users registered via local or Google OAuth

#### Banned Users
When a user is banned:
- Cannot log in (local or OAuth)
- Receives error: "Your account has been banned. Please contact support."
- Existing sessions remain valid until token expires
- Can be unbanned by admins at any time

### Security Best Practices

1. **Protect the Secret Key**
   - Store in environment variables only
   - Don't share via insecure channels (email, chat, etc.)
   - Rotate periodically

2. **Limit Admin Accounts**
   - Only create admin accounts for trusted personnel
   - Review admin accounts regularly
   - Remove admin access when no longer needed

3. **Monitor Admin Activity**
   - Check Audit Logs regularly (`/admin/audit-logs`)
   - Investigate suspicious admin actions
   - Track who creates/modifies admin accounts

4. **Production Deployment**
   - Use strong, unique secret keys for each environment
   - Enable HTTPS for all admin pages
   - Consider IP whitelisting for admin routes
   - Implement rate limiting on admin endpoints

### Role Differences

| Feature | User | Admin |
|---------|------|-------|
| Create Links | ✅ | ✅ |
| View Analytics | ✅ | ✅ |
| Join Watch Parties | ✅ | ✅ |
| Access Admin Console | ❌ | ✅ |
| Manage All Links | ❌ | ✅ |
| Ban/Unban Users | ❌ | ✅ |
| View Audit Logs | ❌ | ✅ |
| System Settings | ❌ | ✅ |

### Troubleshooting

**"Invalid admin secret key" error**
- Verify the key matches exactly what's in `server/.env`
- Check for typos or extra spaces
- Restart the server after changing `.env`

**Can't access admin pages**
- Ensure your account has `role: 'admin'` in the database
- Check MongoDB database directly if needed
- Log out and log back in to refresh token

**OAuth admin creation**
- First OAuth admin login creates the account automatically
- Subsequent logins verify admin role
- Regular users attempting OAuth admin login are blocked

### Emergency Admin Access

If you need to manually create an admin account:

```javascript
// Connect to MongoDB and run:
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin", status: "active" } }
)
```

Or use the `createAdmin.js` script (if available) in the `server/scripts/` directory.

---

## Summary

✅ **Implemented Security Features:**
- Admin secret key validation during registration
- Banned user blocking (local and OAuth)
- Role-based access control
- Real-time user management
- Audit logging for admin actions

🔒 **Keep Your System Secure:**
- Protect your `ADMIN_SECRET_KEY`
- Regularly review admin accounts
- Monitor audit logs
- Update secret keys periodically
