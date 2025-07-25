# Claude Development Notes

## Project Overview
Matt Git Review - A GitHub organization management tool that generates automated performance reviews and standup summaries.

## Key Features
- GitHub OAuth authentication
- Organization dashboard with performance reviews
- Standup summaries generation
- JWT token management with automatic expiration handling
- Date range filtering for reports

## Development Commands
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run linting
pnpm lint

# Build for production
pnpm build
```

## Architecture Notes

### Authentication Flow
- Uses NextAuth with GitHub provider
- Custom JWT token validation via useValidatedSession hook
- Automatic token expiration handling with redirect to login
- Fetch interceptor for global 401 error handling

### Key Components
- **useValidatedSession**: Custom hook that wraps useSession with JWT validation
- **authenticatedFetch**: Global fetch interceptor for handling expired tokens
- **QueryAuthHandler**: Handles organization-specific authentication
- **DashboardLayout**: Main layout wrapper for organization pages
- **DateRangePicker**: Date selection with ranges up to 3 years

### File Structure
- `/src/app/` - Next.js app router pages
- `/src/components/` - Reusable React components
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions and API clients

### API Integration
- Matt API for fetching activities and generating reports
- GitHub API for organization data
- Custom fetch wrapper with JWT authentication

### Recent Changes
- Implemented JWT token expiration handling
- Created useValidatedSession hook for centralized token validation
- Simplified GitHub connect page with clean design
- Updated dashboard to show centered content when no organizations
- Removed date pipe separators and extended ranges to 3 years
- Added performance report date selection requirement

### Performance Notes
- Uses React.memo and useCallback for optimization
- Implements loading states for better UX
- Date picker uses client-side state for instant response

### Testing
- Lint checks pass (only minor img optimization warnings)
- Manual testing recommended for authentication flows
- Test with both authenticated and unauthenticated states