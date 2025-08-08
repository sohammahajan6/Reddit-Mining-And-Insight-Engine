# Reddit AI Solution Generator

A comprehensive, production-ready web application that generates AI-powered solutions for Reddit posts using Google's Gemini AI. Features a modern UI, complete user management system, analytics dashboard, enterprise tools, and robust PostgreSQL backend.

## 🌟 **Overview**

Transform Reddit discussions into actionable insights with AI-powered solution generation. This full-stack application provides intelligent responses to Reddit questions, comprehensive analytics, user management, and enterprise-grade business analysis tools.

## ✨ **Key Features**

### 🔐 **Authentication & User Management**
- **Multi-Role System**: User, Moderator, and Admin roles with JWT authentication
- **Secure Registration/Login**: Email validation, bcrypt hashing, role-specific flows
- **Profile Management**: Complete profiles with avatars, bio, location, social links
- **Session Management**: Refresh tokens, session warnings, secure logout

### 🎯 **AI Solution Generation**
- **Smart Subreddit Discovery**: Popular subreddits + custom search with validation
- **Real-Time Reddit Integration**: Live post fetching with advanced filtering
- **Google Gemini AI**: Context-aware solution generation with multiple templates
- **Solution Customization**: Professional/casual/technical tones, variable length
- **Feedback System**: Like/dislike with AI-powered regeneration
- **Batch Processing**: Generate solutions for multiple posts simultaneously

### 📊 **Analytics & Intelligence**
- **Real-Time Analytics**: Track generations, feedback, success rates
- **Google Sheets Integration**: Automatic logging of solutions and metrics
- **Personal Statistics**: Individual usage patterns and achievements
- **System Analytics**: Platform-wide metrics and performance monitoring
- **Data Export**: Comprehensive reporting and analytics export

### 🔖 **Content Management**
- **Advanced Bookmarking**: Save solutions and posts with categorization
- **Smart Organization**: Tags, categories, favorites, privacy controls
- **Powerful Search**: Full-text search across all saved content
- **Filtering System**: Filter by type, subreddit, date, favorites
- **Bulk Operations**: Mass bookmark management and organization

### 🏢 **Enterprise Features**
- **Business Analysis**: AI-powered market research from Reddit discussions
- **Opportunity Detection**: Identify trends, pain points, business opportunities
- **Enterprise Dashboard**: Professional business intelligence interface
- **Market Insights**: Competitive analysis and industry intelligence
- **Professional Reporting**: Business-grade analysis and recommendations

### 👑 **Admin Dashboard**
- **User Management**: Complete user administration and role control
- **System Monitoring**: Real-time health checks and performance metrics
- **Content Moderation**: Review and moderate user-generated content
- **Analytics Dashboard**: Comprehensive system analytics and insights
- **Configuration**: System settings, rate limits, feature management

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **React 18**: Modern hooks-based architecture with functional components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Theme System**: Complete dark/light mode with user preferences
- **State Management**: Context API for auth, theme, and global state
- **Professional UI**: Modern gradients, animations, and micro-interactions

### **Backend Stack**
- **Node.js + Express**: RESTful API with comprehensive middleware
- **PostgreSQL**: Production database with connection pooling
- **Knex.js**: Schema migrations, seeds, and query building
- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Security**: Helmet, rate limiting, CORS, input validation

### **AI & Integrations**
- **Google Gemini AI**: Advanced language model for solution generation
- **Reddit API**: Real-time post fetching with snoowrap client
- **Google Sheets**: Automated analytics logging and data export
- **Health Monitoring**: Comprehensive service health checks

## 📁 **Project Structure**

```
reddit-ai-solution/
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── AdminDashboard.js
│   │   │   ├── UserProfile.js
│   │   │   ├── AuthModal.js
│   │   │   ├── SubredditSelector.js
│   │   │   ├── MultipleSolutionsDisplay.js
│   │   │   └── ...
│   │   ├── pages/              # Full page components
│   │   │   ├── AdminPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── EnterprisePage.js
│   │   │   └── ...
│   │   ├── contexts/           # React contexts
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── services/           # API services
│   │   │   ├── authService.js
│   │   │   ├── adminService.js
│   │   │   ├── redditService.js
│   │   │   ├── geminiService.js
│   │   │   └── ...
│   │   └── utils/              # Utility functions
│   └── public/                 # Static assets
├── backend/                     # Node.js API Server
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── admin.js
│   │   │   ├── reddit.js
│   │   │   ├── gemini.js
│   │   │   ├── analytics.js
│   │   │   ├── bookmarks.js
│   │   │   └── enterprise.js
│   │   ├── models/             # Data models
│   │   │   ├── User.js
│   │   │   └── ...
│   │   ├── repositories/       # Data access layer
│   │   │   ├── userRepository.js
│   │   │   └── ...
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── ...
│   │   ├── clients/            # External API clients
│   │   │   ├── redditClient.js
│   │   │   ├── geminiClient.js
│   │   │   └── sheetsClient.js
│   │   ├── database/           # Database management
│   │   │   ├── migrations/     # Schema migrations
│   │   │   └── seeds/          # Seed data
│   │   └── config/             # Configuration
│   │       ├── database.js
│   │       └── ...
│   └── uploads/                # File uploads (avatars)
├── scripts/                     # Utility scripts
│   ├── setup.js
│   ├── health-check.js
│   └── test-integration.js
└── docs/                       # Documentation
    ├── SETUP.md
    ├── DATABASE_SETUP.md
    └── PROJECT_SUMMARY.md
```

## 🗄️ **Database Schema**

### **Core Tables**
- **users**: User accounts, profiles, preferences, statistics
- **analytics_events**: Comprehensive event tracking and metrics
- **user_sessions**: Secure session management
- **bookmarks**: User-saved solutions and posts with metadata
- **system_settings**: Application configuration and settings

### **Key Features**
- **PostgreSQL**: Production-ready relational database
- **Migrations**: Version-controlled schema changes with Knex
- **Seeds**: Automated test data and admin user creation
- **Indexing**: Optimized queries for performance
- **Connection Pooling**: Efficient database connections

## ⚡ **Quick Start**

```bash
# Clone and setup
git clone <your-repo-url>
cd reddit-ai-solution
npm run setup

# Configure API keys in .env files


# Setup database
cd backend
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev

# Open http://localhost:3000
```

## 🔧 **Environment Variables**

### **Required API Keys**
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET`
- `GEMINI_API_KEY`
- `GOOGLE_SHEETS_PRIVATE_KEY` & `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`

See `.env.example` files for complete configuration options.

## 🚀 **Available Scripts**

```bash
npm run setup          # Initial project setup
npm run dev           # Start both frontend and backend
npm run dev:backend   # Start backend only (port 3001)
npm run dev:frontend  # Start frontend only (port 3000)
npm run health-check  # Verify all services are working
npm run build         # Build frontend for production
npm test             # Run all tests
npm run test:integration  # Run integration tests
```

## 🔍 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration with role selection
- `POST /api/auth/login` - User login with role validation
- `POST /api/auth/refresh` - Refresh JWT tokens
- `POST /api/auth/logout` - Secure logout

### **User Management**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload user avatar
- `GET /api/users/stats` - Get user statistics

### **Reddit Integration**
- `GET /api/reddit/popular-subreddits` - Get popular subreddit list
- `POST /api/reddit/fetch-posts` - Fetch multiple posts from subreddit
- `POST /api/reddit/validate-subreddit` - Validate subreddit exists

### **AI Solutions**
- `POST /api/gemini/generate-solution` - Generate AI solution for post
- `POST /api/gemini/regenerate-solution` - Improve solution with feedback
- `POST /api/gemini/batch-generate` - Generate solutions for multiple posts
- `GET /api/gemini/health` - Check AI service status

### **Analytics & Data**
- `POST /api/analytics/log-event` - Log user interaction events
- `GET /api/analytics/user-stats` - Get user analytics
- `GET /api/analytics/system-stats` - Get system-wide analytics
- `POST /api/sheets/log-response` - Log data to Google Sheets
- `GET /api/sheets/statistics` - Get usage statistics

### **Bookmarks**
- `GET /api/bookmarks` - Get user bookmarks with filtering
- `POST /api/bookmarks` - Create new bookmark
- `PUT /api/bookmarks/:id` - Update bookmark
- `DELETE /api/bookmarks/:id` - Delete bookmark

### **Enterprise**
- `POST /api/enterprise/analyze-opportunity` - Business opportunity analysis
- `GET /api/enterprise/market-insights` - Market research insights

### **Admin (Admin/Moderator only)**
- `GET /api/admin/users` - Get all users with pagination
- `PUT /api/admin/users/:id` - Update user (role, status)
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/system-stats` - Get comprehensive system statistics
- `GET /api/admin/analytics` - Get detailed analytics dashboard data

## 🎨 **User Interface Features**

### **Main Application Flow**
1. **Authentication**: Role-based login/registration
2. **Subreddit Selection**: Popular options or custom search
3. **Post Configuration**: Select number of posts to fetch
4. **Post Selection**: Choose specific posts from fetched results
5. **Solution Generation**: AI-powered solution creation
6. **Feedback & Iteration**: Like/dislike with regeneration
7. **Analytics & Insights**: View personal and system statistics

### **Professional UI Components**
- **Responsive Design**: Mobile-first approach with breakpoints
- **Dark/Light Theme**: Complete theme system with user preferences
- **Loading States**: Professional spinners and progress indicators
- **Toast Notifications**: Real-time feedback for user actions
- **Modal Systems**: Overlay modals for auth, profiles, and content
- **Gradient Design**: Modern gradient backgrounds and buttons
- **Micro-interactions**: Hover effects, transitions, and animations

## 🛡️ **Security Features**

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with 12 salt rounds
- **Rate Limiting**: Protection against abuse and spam
- **Input Validation**: Comprehensive Joi schema validation
- **CORS Configuration**: Secure cross-origin resource sharing
- **Helmet Security**: Security headers and protection middleware
- **Role-Based Access**: Protected routes and features by user role
- **Session Management**: Secure session handling with refresh tokens

## 📊 **Analytics & Monitoring**

### **Tracked Metrics**
- Solution generation success rates
- User feedback patterns and satisfaction
- Popular subreddits and trending topics
- API response times and performance
- Error rates and system health
- User engagement and retention
- Feature usage and adoption

### **Reporting Features**
- Real-time dashboard analytics
- Google Sheets integration for data export
- Personal user statistics and achievements
- System-wide performance monitoring
- Business intelligence for enterprise users

## 🧪 **Testing & Quality**

```bash
# Health checks
npm run health-check

# Integration tests
npm run test:integration

# Individual service tests
curl http://localhost:3001/health
curl http://localhost:3001/api/reddit/popular-subreddits
curl http://localhost:3001/api/gemini/health
curl http://localhost:3001/api/sheets/health
```

## 🚀 **Deployment**

### **Production Setup**
1. **Database**: Setup PostgreSQL with production credentials
2. **Environment**: Configure all production environment variables
3. **Build**: `npm run build` for frontend production build
4. **Deploy**: Deploy backend API and frontend static files
5. **SSL**: Configure HTTPS and domain settings
6. **Monitoring**: Setup health checks and monitoring

### **Environment Configuration**
- Development: Local PostgreSQL, development API keys
- Staging: Staging database, test API credentials
- Production: Production database, live API keys, SSL

## 📝 **Documentation**

- **[SETUP.md](SETUP.md)**: Detailed setup instructions
- **[DATABASE_SETUP.md](backend/DATABASE_SETUP.md)**: Database configuration
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)**: Complete feature overview

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request with detailed description

## 🆘 **Support**

For issues and questions:
1. Check the documentation in `/docs`
2. Review the troubleshooting section in SETUP.md
3. Open an issue with detailed information and logs

