import { lazy, Suspense, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './i18n';
import { AuthProvider } from './context/AuthContext';
import { InitProvider } from './context/InitContext';
import { NotesProvider } from './context/NotesContext';
import { LabelsProvider } from './context/LabelsContext';
import { TagsProvider } from './context/TagsContext';
import { CollectionsProvider } from './context/CollectionsContext';
import { InsurancesProvider } from './context/InsurancesContext';
import { SubscriptionsProvider } from './context/SubscriptionsContext';
import { ChallengesProvider } from './context/ChallengesContext';
import AuthGuard from './components/auth/AuthGuard';
import ApprovalGuard from './components/auth/ApprovalGuard';
import AdminGuard from './components/admin/AdminGuard';
import { useFeatures } from './context/FeaturesContext';
import Layout from './components/layout/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const InsurancesPage = lazy(() => import('./pages/InsurancesPage'));
const SubscriptionsPage = lazy(() => import('./pages/SubscriptionsPage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));

function PageLoader() {
  const { t } = useLanguage();
  return <div className="text-[#7a7890] text-[14px] text-center pt-40">{t.common.loading}</div>;
}

const FEATURE_ROUTES: Record<string, string> = {
  challenges: '/challenges',
  notes: '/notes',
  insurances: '/insurances',
  subscriptions: '/subscriptions',
};

function FeatureHome() {
  const { features } = useFeatures();
  for (const feat of ['challenges', 'notes', 'insurances', 'subscriptions'] as const) {
    const route = FEATURE_ROUTES[feat];
    if (features.includes(feat) && route) {
      return <Navigate to={route} replace />;
    }
  }
  return <PageLoader />;
}

// Only wrap children with providers for features the user has
function DataProviders({ children }: { children: ReactNode }) {
  const { hasFeature, loading } = useFeatures();

  if (loading) {
    return <>{children}</>;
  }

  let node = children;

  if (hasFeature('challenges')) {
    node = <ChallengesProvider>{node}</ChallengesProvider>;
  }
  if (hasFeature('subscriptions')) {
    node = <SubscriptionsProvider>{node}</SubscriptionsProvider>;
  }
  if (hasFeature('insurances')) {
    node = <InsurancesProvider>{node}</InsurancesProvider>;
  }
  if (hasFeature('notes') || hasFeature('collections')) {
    node = (
      <NotesProvider>
        <LabelsProvider>
        <TagsProvider>
          <CollectionsProvider>
            {node}
          </CollectionsProvider>
        </TagsProvider>
        </LabelsProvider>
      </NotesProvider>
    );
  }

  return <>{node}</>;
}

export default function App() {
  return (
    <LanguageProvider>
    <HashRouter>
      <AuthProvider>
        <AuthGuard>
          <InitProvider>
          <ApprovalGuard>
            <DataProviders>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<FeatureHome />} />
                    <Route path="/challenges" element={<ChallengesPage />} />
                    <Route path="/notes" element={<HomePage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/c/:slug" element={<CollectionPage />} />
                    <Route path="/insurances" element={<InsurancesPage />} />
                    <Route path="/subscriptions" element={<SubscriptionsPage />} />
                    <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
                  </Routes>
                </Suspense>
              </Layout>
            </DataProviders>
          </ApprovalGuard>
          </InitProvider>
        </AuthGuard>
      </AuthProvider>
    </HashRouter>
    </LanguageProvider>
  );
}
