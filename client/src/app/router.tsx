import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RootLayout } from '@/components/layout/RootLayout'
import { AboutPage } from '@/pages/about/AboutPage'
import { ApplyDoctorPage } from '@/pages/apply-doctor/ApplyDoctorPage'
import { AppointmentsPage } from '@/pages/appointments/AppointmentsPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { BlogListPage } from '@/pages/blog/BlogListPage'
import { BlogPostPage } from '@/pages/blog/BlogPostPage'
import { ClinicsPage } from '@/pages/clinics/ClinicsPage'
import { ContactPage } from '@/pages/contact/ContactPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { FamilyPage } from '@/pages/family/FamilyPage'
import { HomePage } from '@/pages/home/HomePage'
import { PrivacyPolicyPage } from '@/pages/legal/PrivacyPolicyPage'
import { TermsOfServicePage } from '@/pages/legal/TermsOfServicePage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { SpecialtyPage } from '@/pages/specialties/SpecialtyPage'
import { TelemedicinePage } from '@/pages/telemedicine/TelemedicinePage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/telemedicine', element: <TelemedicinePage /> },
      { path: '/specialties/:slug', element: <SpecialtyPage /> },
      { path: '/clinics', element: <ClinicsPage /> },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/family', element: <FamilyPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/privacy', element: <PrivacyPolicyPage /> },
      { path: '/terms', element: <TermsOfServicePage /> },
      { path: '/apply-doctor', element: <ApplyDoctorPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])
