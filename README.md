# OmNom - Recipe Discovery Platform

A modern, social recipe sharing platform built with React, TypeScript, and Supabase. Users can discover, create, share, and remix recipes while connecting with other food enthusiasts.

## 🍽️ Features

- **Recipe Management**: Create, edit, and delete recipes with rich metadata
- **Social Features**: Like, save, comment, and follow other users
- **Recipe Remixing**: Build upon existing recipes with attribution
- **Advanced Search**: Filter by cuisine, dietary preferences, difficulty, and tags
- **User Profiles**: Customizable profiles with avatars and bios
- **Responsive Design**: Beautiful UI that works on all devices
- **Real-time Updates**: Live interactions and notifications
- **Image Upload**: Secure image storage for recipe photos

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: Supabase Auth with Row Level Security
- **Deployment**: Vite build system with optimized chunks

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd OmNom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Page components
├── services/           # API services
└── utils/              # Helper utilities
```

### Key Components

- **AuthContext**: Manages user authentication state
- **ProtectedRoute**: Route protection for authenticated users
- **RecipeCard**: Displays recipe previews
- **Modal**: Reusable modal component
- **Navbar**: Main navigation with search

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Content Security Policy**: XSS protection
- **Secure Headers**: Comprehensive security headers
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Type and size restrictions
- **Error Handling**: Generic error messages to prevent information disclosure

## 🚀 Production Deployment

### Environment Setup

1. **Create production Supabase project**
   - Set up a new Supabase project for production
   - Configure authentication settings
   - Set up storage buckets for images

2. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
   NODE_ENV=production
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

### Deployment Options

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables

#### Static Hosting (AWS S3, Cloudflare Pages, etc.)
1. Upload the `dist` folder contents
2. Configure environment variables
3. Set up custom domain and HTTPS

### Critical Production Checklist

- [ ] **Environment Variables**: Configure production Supabase credentials
- [ ] **Domain & HTTPS**: Set up custom domain with SSL certificate
- [ ] **CORS Settings**: Configure Supabase CORS for your domain
- [ ] **Storage Buckets**: Set up and configure image storage
- [ ] **RLS Policies**: Verify all Row Level Security policies are enabled
- [ ] **Monitoring**: Set up error tracking (Sentry, LogRocket, etc.)
- [ ] **Backup Strategy**: Configure database backups
- [ ] **Rate Limiting**: Implement API rate limiting if needed

### Supabase Production Setup

1. **Database Migrations**
   ```bash
   # Apply all migrations to production
   supabase db push
   ```

2. **Storage Buckets**
   - Create `recipe-images` bucket for recipe photos
   - Create `avatars` bucket for user avatars
   - Set appropriate RLS policies

3. **Authentication Settings**
   - Configure allowed redirect URLs
   - Set up email templates
   - Configure OAuth providers if needed

## 🔧 Configuration

### Supabase Setup

1. **Create Tables**: All tables are created via migrations
2. **Enable RLS**: Row Level Security is enabled on all tables
3. **Storage**: Configure storage buckets with proper policies
4. **Auth**: Set up authentication with proper redirect URLs

### Customization

- **Styling**: Modify Tailwind classes in components
- **Features**: Add new features by extending existing components
- **Database**: Add new tables via Supabase migrations
- **Authentication**: Customize auth flow in AuthContext

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check TypeScript errors: `npm run lint`

2. **Authentication Issues**
   - Verify Supabase environment variables
   - Check CORS settings in Supabase dashboard
   - Ensure redirect URLs are configured

3. **Image Upload Failures**
   - Verify storage bucket exists and has proper policies
   - Check file size limits (10MB max)
   - Ensure proper file types (images only)

4. **Database Errors**
   - Run migrations: `supabase db push`
   - Check RLS policies are enabled
   - Verify table structure matches expectations

## 📊 Performance

- **Bundle Size**: Optimized with Vite and manual chunking
- **Images**: Compressed and optimized for web
- **Database**: Indexed queries for fast performance
- **Caching**: Browser caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review Supabase documentation
- Open an issue on GitHub

## 🔄 Updates

Keep your application updated:
- Regularly update dependencies: `npm update`
- Monitor for security updates
- Test thoroughly after updates
- Follow Supabase release notes

---

**Built with ❤️ using React, TypeScript, and Supabase**
