import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { HomePage } from '@/pages/HomePage';
import { MaterialsPage } from '@/pages/MaterialsPage';
import { CourseCataloguePage } from '@/pages/CourseCataloguePage';
import { ResourceDetailPage } from '@/pages/ResourceDetailPage';
import { PracticePage } from '@/pages/PracticePage';
import { TestRunnerPage } from '@/pages/TestRunnerPage';
import { HowItWorksPage } from '@/pages/HowItWorksPage';
import { PricingPage } from '@/pages/PricingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PaymentResultPage } from '@/pages/PaymentResultPage';
import { PaymentsPage } from '@/pages/PaymentsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AboutPage, HelpPage, PrivacyPage, TermsPage } from '@/pages/StaticPages';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/materials', element: <MaterialsPage /> },
      { path: '/materials/:id', element: <ResourceDetailPage /> },
      { path: '/courses', element: <CourseCataloguePage /> },
      { path: '/practice', element: <PracticePage /> },
      { path: '/practice/:id', element: <TestRunnerPage /> },
      { path: '/how-it-works', element: <HowItWorksPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/help', element: <HelpPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/terms', element: <TermsPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/payments', element: <PaymentsPage /> },
      { path: '/payment/return', element: <PaymentResultPage /> },
      { path: '/payments/result', element: <PaymentResultPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
