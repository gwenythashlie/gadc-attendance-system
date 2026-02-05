# ✅ Supabase Quick Start Checklist

Follow these steps to get your backend running with Supabase:

---

## 📋 Checklist

### 1. Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Sign up/Login
- [ ] Click "New Project"
- [ ] Fill in details (name, password, region)
- [ ] Wait 2-3 minutes for setup

### 2. Get API Credentials
- [ ] In Supabase dashboard, go to Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **service_role key** (secret!)
- [ ] Copy **anon key** (public)

### 3. Configure Backend
- [ ] Create `backend/.env` file
- [ ] Add SUPABASE_URL=your-url
- [ ] Add SUPABASE_SERVICE_KEY=your-key
- [ ] Add SUPABASE_ANON_KEY=your-anon-key
- [ ] Add JWT_SECRET=random-string

### 4. Create Database Tables
- [ ] In Supabase, go to SQL Editor
- [ ] Open `backend/migrations/supabase-schema.sql`
- [ ] Copy all SQL code
- [ ] Paste in SQL Editor
- [ ] Click "Run" or press Ctrl+Enter
- [ ] Verify in Table Editor (should see 5 tables)

### 5. Create Admin User
- [ ] Run: `node backend/migrations/generate-admin-password.js`
- [ ] Copy the generated SQL
- [ ] Paste in Supabase SQL Editor
- [ ] Run it

### 6. Install Dependencies
- [ ] Open terminal in `backend/` folder
- [ ] Run: `npm install`
- [ ] Verify `@supabase/supabase-js` is installed

### 7. Start Server
- [ ] Run: `npm start`
- [ ] Server should start on http://localhost:3000
- [ ] Check for errors in terminal

### 8. Test Endpoints
- [ ] Test health: `curl http://localhost:3000/api/health`
- [ ] Test login: See command below
- [ ] Should get JWT token back

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🎯 Quick Test Commands

### Health Check
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Login
```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Expected: `{"token":"...","user":{...}}`

### Get Employees (use token from login)
```bash
curl http://localhost:3000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected: `[{...}]` (array of employees)

---

## 🚨 Troubleshooting

### Server won't start
- Check `.env` file exists in `backend/` folder
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- Run `npm install` again

### "Invalid API key" error
- Make sure you're using `SUPABASE_SERVICE_KEY` (not anon key)
- Check for extra spaces in `.env` file
- Verify key is correct in Supabase dashboard

### "relation does not exist" error
- Run the SQL schema in Supabase SQL Editor
- Check table names in Table Editor
- Make sure SQL ran successfully

### Login fails
- Make sure admin user was created
- Run generate-admin-password.js
- Check password hash in admin_users table

---

## 📚 Need More Help?

- **Full Guide:** Read `MIGRATION_GUIDE.md`
- **Detailed Setup:** Read `backend/SUPABASE_SETUP.md`
- **Supabase Docs:** https://supabase.com/docs
- **Backend API:** Read `backend/API_DOCUMENTATION.md`

---

**Status:** Follow checklist above to get started! ✅

All the code is ready - you just need to set up Supabase and configure the `.env` file.
