# Database Setup Guide

##  Setting up your Neon PostgreSQL Database

### 1. Environment Configuration

Create a `.env` file in the `apps/api` directory with your Neon database URL:

```bash
# Copy from env.example and update with your values
cp env.example .env
```

Update the `.env` file with your actual Neon database URL:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
```

**Important**: Replace the placeholder with your actual Neon PostgreSQL connection string.

### 2. Database Migration

Run the database migration to create all tables:

```bash
npm run db:push
```

This will create the following tables:
- `files` - Stores uploaded file metadata and content
- `summaries` - Stores AI-generated summaries
- `summary_versions` - Stores version history of summaries
- `email_requests` - Stores email sharing history

### 3. Verify Database Connection

Test your database connection:

```bash
npm run dev
```

The server should start without database connection errors.

**Health Check Endpoints:**
- `/health` - Basic server health (no database connection)
- `/health/db` - Database connection test (triggers connection)

**Note**: The database connection is lazy-loaded, meaning it only connects when you first make a database request. This prevents startup errors if the database is temporarily unavailable.

### 4. Database Management Commands

```bash
# Generate new migrations (when schema changes)
npm run db:generate

# Push schema changes to database
npm run db:push

# Run specific migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

### 5. Database Schema Overview

#### Files Table
- Stores uploaded document metadata
- Includes file content for processing
- Tracks word count and file size

#### Summaries Table
- Links to uploaded files
- Stores AI-generated content
- Tracks version and tokens used

#### Summary Versions Table
- Maintains history of all summary changes
- Links to parent summary
- Stores prompts used for each version

#### Email Requests Table
- Tracks all email sharing activity
- Links to summaries being shared
- Stores recipient and message details

### 6. Production Considerations

- **Backup**: Ensure your Neon database has automated backups enabled
- **Scaling**: Neon automatically scales based on usage
- **Security**: Use environment variables for database credentials
- **Monitoring**: Monitor database performance and connection limits

### 7. Troubleshooting

#### Common Issues:

1. **Connection Refused**: Check your DATABASE_URL format
2. **Permission Denied**: Verify database user permissions
3. **Table Not Found**: Run `npm run db:push` to create tables
4. **Migration Errors**: Check schema compatibility

#### Getting Help:

- Check Neon dashboard for connection status
- Verify environment variables are loaded
- Check server logs for detailed error messages

---

**Next Steps**: After setting up the database, your app will be production-ready with persistent data storage! 