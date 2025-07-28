# GroveScheduler

A modern web application built with Next.js for efficient task scheduling and media management. GroveScheduler provides an intuitive interface for managing schedules, uploading media files, and monitoring system activities in real-time.

## Features

- **Task Scheduling**: Create, edit, and manage schedules with ease
- **File Upload**: Support for MP3, MP4, and Playlist (.pls) files
- **Real-time Notifications**: Instant feedback on uploads and system updates
- **Drag-and-Drop**: Seamless file upload experience
- **Responsive Design**: Optimized for desktop and mobile devices
- **Authentication**: Secure login system
- **Logging & Monitoring**: Comprehensive system logs and status tracking
- **Time Management**: RTC and system time synchronization
- **Backup & Restore**: Schedule backup and restoration capabilities

## Tech Stack

- **Frontend**: Next.js, React, JavaScript/JSX
- **Styling**: CSS Modules, Global CSS
- **File Handling**: Drag-and-drop file uploads
- **API**: RESTful API endpoints
- **Deployment**: Static site generation support

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/)

## Getting Started

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sh9336/newScheduler.git
   cd newScheduler
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NODE_ENV=development
   API_BASE_URL=http://localhost:3000/api
   ```

### Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Production Build

For static site generation (recommended for deployment):

1. **Backup and remove API folder** (required for static export)
   ```bash
   # Backup your api folder first
   cp -r src/app/api ./api-backup
   rm -rf src/app/api
   ```

2. **Update next.config.mjs**
   ```javascript
   // next.config.mjs
   const nextConfig = {
     output: 'export',
     basePath: '/static',
   };

   export default nextConfig;
   ```

3. **Build the project**
   ```bash
   npx next build
   ```

## Project Structure

```
├── public/                 # Static assets (images, fonts, styles)
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes (development only)
│   │   ├── contact/      # Contact page
│   │   ├── emergency-tracks/ # Emergency tracks management
│   │   ├── login/        # Authentication page
│   │   ├── logs/         # System logs page
│   │   ├── schedules/    # Schedule management
│   │   ├── status/       # System status page
│   │   ├── time/         # Time management page
│   │   ├── tracks/       # Media tracks page
│   │   └── restart/      # System restart page
│   ├── components/        # Reusable React components
│   │   ├── Modals/       # Modal components
│   │   ├── AuthGuard.jsx
│   │   ├── Navbar.jsx
│   │   └── ...
│   ├── styles/           # CSS modules and global styles
│   └── utils/            # Utility functions
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/do_login` - User authentication

### Asset Management
- `POST /api/newAsset` - Upload new media asset
- `POST /api/updateAsset` - Update existing asset
- `POST /api/deleteAsset` - Delete asset
- `POST /api/previewAsset` - Preview asset

### Schedule Management
- `POST /api/newSchedule` - Create new schedule
- `POST /api/updateSchedule` - Update existing schedule
- `POST /api/deleteSchedule` - Delete schedule
- `POST /api/toggleSchedule` - Enable/disable schedule
- `POST /api/start_sch_now` - Start schedule immediately
- `POST /api/stop_sch_now` - Stop schedule immediately

### System Operations
- `GET /api/initWithTime` - Initialize with time configurations
- `GET /api/getRTCAndSystemTime` - Get RTC and system time
- `POST /api/updateTime` - Synchronize time
- `POST /api/clockSkewOffset` - Adjust clock skew
- `GET /api/logs` - Fetch system logs
- `POST /api/do_reset` - Reset system

### Backup & Restore
- `GET /api/backupSchedules` - Download schedule backup
- `POST /api/restoreSchedules` - Restore from backup

## Key Features

### Schedule Management
- Create and manage multiple schedules
- Enable/disable schedules individually
- Real-time schedule execution
- Emergency track support

### Media Management
- Support for MP3, MP4, and .pls files
- Drag-and-drop upload interface
- Asset preview functionality
- File organization and management

### System Monitoring
- Comprehensive logging system
- Real-time status monitoring
- Time synchronization tools
- System restart capabilities

### User Experience
- Responsive design for all devices
- Intuitive navigation
- Real-time notifications
- Modal-based interactions

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `API_BASE_URL` | Base URL for API calls | `http://localhost:3000/api` |

### Next.js Configuration

For static export deployment, update `next.config.mjs`:

```javascript
const nextConfig = {
  output: 'export',
  basePath: '/static',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
```

## Deployment

1. Build the project for production
2. Deploy the `out` folder to your hosting provider

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [React Documentation](https://reactjs.org/docs) - Learn React fundamentals
- [CSS Modules](https://github.com/css-modules/css-modules) - Understand CSS Modules


## Author

**sh9336** - [GitHub Profile](https://github.com/sh9336)

---

*Built with Next.js and modern web technologies*
