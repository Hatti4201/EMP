# Employee Management System - Frontend

## 🎯 Overview

A comprehensive Employee Management System built with **React**, **TypeScript**, **Redux Toolkit**, and **Material-UI**. This system provides complete functionality for employee onboarding, personal information management, visa status tracking, and HR administrative tools.

## ✨ Features

### 👤 **Employee Features**
- **🔐 Authentication**: Secure login/registration with JWT tokens
- **📝 Multi-Step Onboarding**: Complete 5-step onboarding process
- **👨‍💼 Profile Management**: Editable personal information sections
- **🛂 Visa Status Management**: OPT workflow with document tracking
- **📄 Document Management**: Upload, preview, and download documents

### 👩‍💼 **HR Features**
- **📊 Dashboard**: Comprehensive analytics and statistics
- **👥 Employee Directory**: Searchable employee profiles
- **📨 Registration Management**: Generate tokens and send invitations
- **📋 Application Review**: Approve/reject onboarding applications
- **🛂 Visa Management**: Review and approve visa documents
- **📧 Notifications**: Send email reminders to employees

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **State Management**: Redux Toolkit, React-Redux
- **UI Library**: Material-UI (MUI) v5
- **Form Management**: React Hook Form + Yup validation
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM v6
- **Date Handling**: Day.js with MUI Date Pickers

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Backend API server running (see API contract below)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd client
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your API base URL
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (StatusChip, ConfirmDialog)
│   ├── documents/       # Document-related components
│   ├── forms/           # Form components (FormField, FileUpload)
│   └── search/          # Search components
├── pages/               # Page components
│   ├── auth/           # Login, Register
│   ├── employee/       # Employee-specific pages
│   └── hr/             # HR-specific pages
├── store/              # Redux store and slices
│   └── slices/         # Auth, Employee, HR slices
├── services/           # API service layer
├── types/              # TypeScript type definitions
└── App.tsx             # Main app component
```

## 🔌 API Integration

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### API Service Structure

The API service is organized by functional modules:

```typescript
// Authentication
api.auth.login(credentials)
api.auth.register(data)
api.auth.me()

// User Profile
api.user.getProfile()
api.user.updateProfileSection(section, data)

// Onboarding
api.onboarding.submit(data)
api.onboarding.getMyApplication()

// File Management
api.files.upload(formData)
api.files.download(filename)

// Visa Management
api.visa.getStatus()
api.visa.uploadDocument(formData)

// HR Management
api.hr.employees.getAll()
api.hr.applications.getPending()
api.hr.tokens.generate(data)
```

## 📋 API Contract

### Base Configuration
- **Base URL**: `/api`
- **Content-Type**: `application/json` (except file uploads)
- **Authentication**: `Authorization: Bearer <JWT token>`

### Key Endpoints

| Module | Endpoint | Method | Purpose |
|--------|----------|--------|---------|
| **Auth** | `/auth/login` | POST | User login |
| **Auth** | `/auth/register` | POST | Employee registration |
| **User** | `/user/profile` | GET | Get profile |
| **User** | `/user/profile/section/:section` | PUT | Update profile section |
| **Onboarding** | `/onboarding` | POST | Submit application |
| **Files** | `/upload` | POST | Upload documents |
| **Visa** | `/visa-status` | GET | Get visa status |
| **HR** | `/hr/employees` | GET | Get all employees |
| **HR** | `/hr/applications?status=pending` | GET | Get pending applications |

## 🎨 UI Components

### Reusable Components

- **FormField**: Standardized form inputs with validation
- **FormSelect**: Dropdown components with React Hook Form integration
- **FileUpload**: Drag-and-drop file upload with preview
- **DocumentViewer**: Document preview dialog with status display
- **SearchBar**: Unified search component with clear functionality
- **StatusChip**: Status indicators with color coding
- **ConfirmDialog**: Confirmation prompts for important actions

### Layout Components

- **Layout**: Main application layout with navigation
- **ProtectedRoute**: Route protection based on authentication
- **LoadingScreen**: Application-wide loading states

## 🔐 Authentication Flow

1. **Registration**: HR generates token → Employee receives email → Registration page
2. **Login**: Username/password → JWT token stored → Redirect to appropriate dashboard
3. **Token Verification**: Automatic token validation on app load
4. **Route Protection**: Unauthenticated users redirected to login

## 👤 Employee Workflow

1. **Registration**: Register with HR-provided token
2. **Onboarding**: Complete 5-step application form
3. **Profile Management**: Edit personal information sections
4. **Visa Management**: Upload required documents in sequence
5. **Document Access**: View, download, and manage uploaded files

## 👩‍💼 HR Workflow

1. **Dashboard**: Overview of system statistics and recent activity
2. **Token Generation**: Create registration links for new employees
3. **Application Review**: Approve/reject onboarding applications
4. **Employee Management**: Search and view employee profiles
5. **Visa Review**: Approve visa documents and send notifications

## 🎯 Key Features

### Multi-Step Forms
- **Step-by-step validation**: Real-time form validation with clear error messages
- **Progress tracking**: Visual indicators for form completion
- **Draft saving**: Preserve form state across sessions

### Document Management
- **File upload**: Drag-and-drop with type and size validation
- **Preview system**: In-browser document viewing (PDF, images)
- **Download functionality**: Secure file downloads
- **Status tracking**: Document approval workflow

### Search & Filtering
- **Real-time search**: Instant results with debouncing
- **Advanced filtering**: Multiple criteria support
- **Pagination**: Efficient large dataset handling

### Responsive Design
- **Mobile-first**: Optimized for all device sizes
- **Modern UI**: Material Design principles
- **Accessibility**: WCAG compliance features

## 🧪 Development

### Code Quality

- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting and style enforcement
- **Prettier**: Consistent code formatting

### State Management

- **Redux Toolkit**: Modern Redux with simplified syntax
- **Typed Hooks**: `useAppSelector` and `useAppDispatch` with full TypeScript support
- **Async Thunks**: Standardized async action handling

### Form Handling

- **React Hook Form**: Performant forms with minimal re-renders
- **Yup Validation**: Schema-based validation
- **Error Handling**: Comprehensive error display and recovery

## 🚀 Deployment

### Build Process

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

### Environment Setup

1. Set `VITE_API_BASE_URL` to your production API
2. Configure your web server to serve the `dist` folder
3. Set up proper routing for SPA (Single Page Application)

## 🤝 Contributing

1. Follow the established file structure
2. Use TypeScript for all new components
3. Implement proper error handling
4. Add loading states for async operations
5. Write reusable components when possible

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [Material-UI Documentation](https://mui.com/)
- [React Hook Form](https://react-hook-form.com/)

---

**Built with ❤️ using modern React patterns and best practices**
