import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { FeaturesProvider } from './context/FeaturesContext';
import { NotesProvider } from './context/NotesContext';
import { LabelsProvider } from './context/LabelsContext';
import { TagsProvider } from './context/TagsContext';
import { CollectionsProvider } from './context/CollectionsContext';
import { InsurancesProvider } from './context/InsurancesContext';
import { SubscriptionsProvider } from './context/SubscriptionsContext';
import { ChallengesProvider } from './context/ChallengesContext';
import AuthGuard from './components/auth/AuthGuard';
import { ApprovalProvider } from './context/ApprovalContext';
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
  return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
}

const FEATURE_ROUTES: Record<string, string> = {
  notes: '/',
  challenges: '/challenges',
  insurances: '/insurances',
  subscriptions: '/subscriptions',
};

function FeatureHome() {
  const { features, hasFeature } = useFeatures();
  if (hasFeature('notes')) return <HomePage />;
  for (const feat of ['challenges', 'insurances', 'subscriptions']) {
    if (features.includes(feat)) {
      return <Navigate to={FEATURE_ROUTES[feat]} replace />;
    }
  }
  return <PageLoader />;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AuthGuard>
          <ApprovalProvider>
          <ApprovalGuard>
          <AdminProvider>
          <FeaturesProvider>
            <NotesProvider>
              <LabelsProvider>
              <TagsProvider>
                <CollectionsProvider>
                  <InsurancesProvider>
                  <SubscriptionsProvider>
                  <ChallengesProvider>
                    <Layout>
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<FeatureHome />} />
                          <Route path="/archive" element={<ArchivePage />} />
                          <Route path="/c/:slug" element={<CollectionPage />} />
                          <Route path="/insurances" element={<InsurancesPage />} />
                          <Route path="/subscriptions" element={<SubscriptionsPage />} />
                          <Route path="/challenges" element={<ChallengesPage />} />
                          <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  </ChallengesProvider>
                  </SubscriptionsProvider>
                  </InsurancesProvider>
                </CollectionsProvider>
              </TagsProvider>
              </LabelsProvider>
            </NotesProvider>
          </FeaturesProvider>
          </AdminProvider>
          </ApprovalGuard>
          </ApprovalProvider>
        </AuthGuard>
      </AuthProvider>
    </HashRouter>
  );
}
