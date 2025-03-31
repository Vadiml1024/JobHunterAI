# JobAI - AI-Powered Job Search Platform

JobAI is a comprehensive job search platform that leverages artificial intelligence to transform resume analysis and application tracking through intelligent, user-centric technology. The application provides dynamic insights and comprehensive management across multiple job platforms with an emphasis on personalized user experience and engaging interactions.

![JobAI Platform](https://placeholder-for-screenshot.com)

## 🚀 Features

### Resume Management & Analysis
- **AI-Powered Resume Analysis**: Extract skills, experience, education, and summary automatically
- **Resume Improvement Suggestions**: Get personalized feedback to enhance your resume
- **Multiple Resume Support**: Manage different resumes for various job types and industries

### Job Search & Discovery
- **Intelligent Job Matching**: Find roles that match your skills and experience
- **Cross-Platform Search**: Search across multiple job boards in one interface
- **Custom Filters**: Filter by location, job type, salary, and more
- **Recommended Jobs**: Receive AI-curated job recommendations based on your profile

### Application Tracking
- **Comprehensive Application Management**: Track applications across different stages (Applied, Screening, Interview, Offer, Rejected)
- **Application Timeline**: View the history and progression of each application
- **Application Analytics**: Get insights into your application success rate and patterns

### AI Assistant
- **Chat Support**: Interact with an AI assistant for job search advice
- **Cover Letter Generation**: Create customized cover letters for specific job applications
- **Interview Preparation**: Get help preparing for interviews based on job requirements

### Analytics & Insights
- **Job Search Metrics**: Track your job search performance over time
- **Skills Analysis**: Understand how your skills align with market demand
- **Application Quality Score**: Receive feedback on your application materials

### Integration Capabilities
- **Calendar Integration**: Sync interviews and important dates with Google Calendar
- **LinkedIn Profile Import**: Import your professional profile from LinkedIn
- **Export Functionality**: Export your data in various formats

## 🛠️ Technology Stack

### Frontend
- **React**: UI library for building interactive interfaces
- **TypeScript**: Type-safe JavaScript for better development experience
- **TanStack Query**: Data fetching and state management
- **Shadcn/UI + Tailwind CSS**: Modern, responsive UI components and styling
- **Wouter**: Lightweight routing solution

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web framework for building the API
- **PostgreSQL**: Relational database for data storage
- **Drizzle ORM**: Type-safe database queries and schema management

### AI Integration
- **OpenAI API**: Powers advanced natural language processing features
- **Gemini AI**: Alternative AI provider for intelligence features
- **LLM Service Layer**: Abstraction for working with different AI providers

### Authentication & Security
- **Session-based Auth**: Secure user authentication
- **Passport.js**: Authentication middleware

## 🏗️ Architecture

JobAI follows a modern full-stack architecture:

1. **Client Layer**: React-based SPA providing a responsive and interactive UI
2. **API Layer**: Express backend handling data operations and business logic
3. **AI Service Layer**: Abstraction over multiple AI providers (OpenAI, Gemini)
4. **Data Layer**: PostgreSQL database with Drizzle ORM for data persistence
5. **Integration Layer**: Connections with external services (job boards, calendar, etc.)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL
- API keys for OpenAI or Gemini for AI features

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/jobai.git
cd jobai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```
# Create a .env file with the following variables
DATABASE_URL=postgresql://user:password@localhost:5432/jobai
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
SESSION_SECRET=your_session_secret
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5000`

## 📱 Mobile Responsiveness

JobAI is designed to work seamlessly across devices:
- Responsive grid-based layouts
- Mobile-optimized navigation
- Touch-friendly UI elements
- Adaptive content display

## 🔒 Security

- Secure password hashing with bcrypt
- Session-based authentication
- Environment variable protection for sensitive data
- Input validation with Zod

## 🌐 Deployment

The application can be deployed to any Node.js hosting platform. It's currently configured for deployment on Replit with automatic scaling support.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using React, Node.js, PostgreSQL, and AI