# MangoDesk

A full-stack AI-powered meeting notes summarizer that generates intelligent summaries from transcripts with custom instructions, version history, diff viewing, and professional email sharing capabilities.

## ✨ Features

- **File Upload**: Support for .txt and .docx files with enhanced drag & drop
- **AI-Powered Summaries**: Google Gemini Pro integration with custom prompts
- **Version History**: Track all changes with GitHub-like inline diff viewing
- **Inline Editing**: Edit and refine generated summaries with real-time preview
- **Smart Export**: Export summaries as DOCX or TXT with professional formatting
- **Custom Filenames**: Personalize email attachment names for better organization
- **Email Sharing**: Send summaries via email with Resend service and file attachments
- **Responsive Design**: Modern, mobile-first UI built with Next.js and Tailwind CSS
- **Database Storage**: Persistent PostgreSQL database with Drizzle ORM

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **AI Service**: Google Gemini Pro
- **Email Service**: Resend
- **Monorepo**: Turbo for efficient development
- **State Management**: Zustand for client-side state

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon recommended)
- Google Gemini Pro API key
- Resend API key (for email functionality)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../web
npm install
```

### 2. Environment Configuration

#### Backend (.env file in apps/api/)
```bash
# Copy the example file
cp apps/api/env.example apps/api/.env

# Edit with your actual API keys and database
GEMINI_API_KEY=your_actual_gemini_api_key
RESEND_API_KEY=your_actual_resend_api_key
FROM_EMAIL=your_verified_email@domain.com
DATABASE_URL=your_neon_postgresql_connection_string
```

#### Frontend
No additional environment variables needed for basic functionality.

### 3. Database Setup

```bash
cd apps/api

# Generate database migrations
npm run db:generate

# Apply migrations to your database
npm run db:migrate

# Or push schema directly (for development)
npm run db:push

# View database in Drizzle Studio
npm run db:studio
```

### 4. Start Development Servers

```bash
# Start both frontend and backend (from root)
npm run dev

# Or start individually:

# Backend (Port 3001)
cd apps/api
npm run dev

# Frontend (Port 3000)
cd apps/web
npm run dev
```

## 🚀 Usage

### 1. Upload Meeting Transcript
- Drag and drop or click to upload .txt or .docx files
- Maximum file size: 10MB
- Supported formats: .txt, .docx

### 2. Generate AI Summary
- Enter custom instructions for the AI
- Choose from suggested prompts or write your own
- AI generates structured summary based on your requirements

### 3. Edit & Review
- Review the generated summary with Markdown rendering
- Make inline edits as needed
- Track version history with inline diff viewing
- Compare changes between versions like GitHub

### 4. Export & Share
- Export summaries as professionally formatted DOCX or TXT
- Customize filenames for email attachments
- Send via email with Resend service
- Professional email templates with file attachments

## 🔧 API Endpoints

### File Upload
- `POST /api/upload` - Upload transcript files
- `GET /api/upload/:fileId` - Get file content

### Summary Generation
- `POST /api/summary/generate` - Generate AI summary
- `PUT /api/summary/:summaryId` - Update summary
- `GET /api/summary/:summaryId` - Get summary with versions
- `GET /api/summary/:summaryId/versions` - Get version history

### Email Sharing
- `POST /api/email/send` - Send summary via email with custom filenames
- `GET /api/email/history` - Get email sharing history

### Database Health
- `GET /api/health/db` - Check database connection

## 🎨 Customization

### Styling
- Modify `apps/web/tailwind.config.js` for theme changes
- Update `apps/web/app/globals.css` for custom styles

### AI Prompts
- Customize AI behavior in `apps/api/src/services/aiService.ts`
- Modify prompt templates for different use cases

### Email Templates
- Update email HTML in `apps/api/src/services/emailService.ts`
- Customize branding and styling

### Database Schema
- Modify `apps/api/src/db/schema.ts` for database changes
- Run `npm run db:generate` to create new migrations

## 🚀 Deployment

### Database Setup
1. Create a PostgreSQL database (Neon recommended)
2. Set `DATABASE_URL` in your environment
3. Run migrations: `npm run db:migrate`

### Frontend (Vercel)
```bash
cd apps/web
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
cd apps/api
npm run build
# Deploy to your preferred platform
# Ensure DATABASE_URL is set in production
```

## 🔒 Security Features

- File type validation
- File size limits
- Rate limiting
- Input sanitization
- CORS configuration
- Helmet security headers
- Database connection security
- Environment variable protection

## 🧪 Testing

```bash
# Backend tests
cd apps/api
npm run test

# Frontend tests
cd apps/web
npm run test

# Type checking
npm run type-check

# Database operations
cd apps/api
npm run db:studio  # View database in browser
```

## 📁 Project Structure

```
mangodesk/
├── apps/
│   ├── api/                 # Express backend
│   │   ├── src/
│   │   │   ├── db/          # Database schema and connection
│   │   │   ├── routes/      # API endpoints
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/  # Express middleware
│   │   │   └── types/       # TypeScript types
│   │   ├── drizzle.config.ts # Database configuration
│   │   └── package.json
│   └── web/                 # Next.js frontend
│       ├── app/             # App router pages
│       ├── components/      # React components
│       ├── store/           # State management
│       └── package.json
├── packages/                 # Shared packages
├── turbo.json               # Turbo configuration
└── package.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include error logs and steps to reproduce

## 🔮 Recent Enhancements

- **Database Integration**: Migrated from in-memory to PostgreSQL with Drizzle ORM
- **Custom Filenames**: Users can personalize email attachment names
- **Enhanced DOCX Export**: Professional formatting with proper headers and styling
- **Inline Diff Viewing**: GitHub-like version comparison in the main interface
- **Mobile Responsiveness**: Fully responsive design for all screen sizes
- **Smart Defaults**: Auto-generated filenames based on summary content
- **Email Attachments**: Send summaries as DOCX/TXT files instead of inline text

## 🎯 Next Steps

- User authentication and accounts
- Team collaboration features
- Advanced AI models support
- Real-time collaboration
- Mobile app
- API rate limiting dashboard
- Analytics and insights
- Multi-language support
