# Quick Reference Guide - Admin System

## Login Credentials
```
Email: admin@gmail.com
Password: admin123
```

## Important URLs
```
Admin Panel:           http://localhost:3000/admin
Login Page:            http://localhost:3000/admin/login
Dashboard:             http://localhost:3000/admin
Products:              http://localhost:3000/admin/products
Users:                 http://localhost:3000/admin/users
Settings:              http://localhost:3000/admin/settings
Paytm Transactions:    http://localhost:3000/admin/paytm-transactions
Bulk Upload:           http://localhost:3000/admin/bulk-upload
```

## Key Files & Their Purposes

### Core Authentication
- `src/middleware/auth.js` - JWT verification and role checking
- `src/hooks/useAuth.js` - Frontend auth state management
- `src/utils/auth.js` - Token generation and verification

### Admin Pages
- `src/pages/admin/index.js` - Dashboard
- `src/pages/admin/users.js` - User management
- `src/pages/admin/products/index.js` - Product management
- `src/pages/admin/settings.js` - Configuration
- `src/pages/admin/paytm-transactions.js` - Transactions

### API Endpoints
- `src/pages/api/admin/users.js` - User API (GET, POST)
- `src/pages/api/admin/users/[id].js` - Single user (PUT, DELETE)
- `src/pages/api/products/index.js` - Products API
- `src/pages/api/admin/dashboard-stats.js` - Stats
- `src/pages/api/upload.js` - Image upload
- `src/pages/api/payment/upi-config.js` - Payment config

### Components
- `src/components/admin/AdminLayout.js` - Main layout
- `src/components/admin/PaymentMethodsManager.js` - UPI config
- `src/components/admin/AuthDebugger.js` - Token debugging
- `src/components/admin/AdvancedSettings.js` - Settings UI

## Common Tasks

### Add a New Admin User
```bash
# Method 1: Via Admin Panel
1. Login to /admin
2. Navigate to Users
3. Fill form with: Name, Email, Phone, Password
4. Click "Create User"

# Method 2: Via MongoDB
db.users.insertOne({
  name: "New Admin",
  email: "admin2@example.com",
  password: "hashedPassword123",
  role: "admin",
  isActive: true
})
```

### Change Admin Password
```bash
# Via Admin Panel
1. Go to Users
2. Click "Change Password" for user
3. Enter new password (min 8 chars)
4. Save
```

### Test API Endpoint
```bash
# Example: Get all users
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Example: Create user
curl -X POST http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePass123",
    "role": "user",
    "isActive": true
  }'
```

## Troubleshooting

### Users List Not Showing
- Check: Is API responding? (DevTools → Network tab)
- Solution: Ensure response has `users` property (not `data`)
- ✅ FIXED: Updated API response structure

### Navigation Not Working
- Check: Are links using `href` prop?
- Solution: Link component must use Next.js `href` not `to`
- ✅ FIXED: Changed all Link props to `href`

### Login Not Working
- Check: Is token generated?
- Check: Is localStorage storing token?
- Solution: Verify admin user exists in MongoDB
- Solution: Check JWT_SECRET in .env

### API 401 Unauthorized
- Check: Is Bearer token included?
- Check: Has token expired?
- Solution: Re-login to get fresh token

### API 403 Forbidden
- Check: Is user an admin?
- Solution: Verify user.role === 'admin' in database

### Build Errors
- Check: Are all imports valid?
- Check: Do dynamic routes have getStaticPaths?
- ✅ FIXED: Added all missing exports and paths

## Database Structure

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String, // "user" | "admin" | "moderator"
  isActive: Boolean,
  isEmailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Product Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  mrp: Number,
  sellingPrice: Number,
  stock: Number,
  category: String,
  images: [String],
  mainImage: String,
  isActive: Boolean,
  sortOrder: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-super-secure-secret-key
DEFAULT_ADMIN_EMAIL=admin@gmail.com
DEFAULT_ADMIN_PASSWORD=admin123
DEFAULT_ADMIN_NAME=Super Admin
NODE_ENV=development
```

## NPM Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run linter
```

## Recent Fixes (July 29, 2026)
1. ✅ Fixed navigation links (Link href prop)
2. ✅ Added getStaticPaths to dynamic product page
3. ✅ Fixed import paths (upload.js, change-password.js)
4. ✅ Fixed users API response structure (users vs data)

## Documentation Files
- `ADMIN_SYSTEM_STATUS.md` - Complete system status
- `FIXES_APPLIED.md` - All fixes with details
- `API_RESPONSE_STRUCTURE.md` - API endpoint formats
- `VERIFICATION_CHECKLIST.md` - Testing checklist

---

**Last Updated:** July 29, 2026  
**Status:** ✅ All Systems Operational
