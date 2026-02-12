import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { LabelsProvider } from './context/LabelsContext';
import { CollectionsProvider } from './context/CollectionsContext';
import AuthGuard from './components/auth/AuthGuard';
import Layout from './components/layout/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const TrashPage = lazy(() => import('./pages/TrashPage'));
const ArchivePage = lazy(() => import('./pages/ArchivePage'));
const CollectionPage = lazy(() => import('./pages/CollectionPage'));

function PageLoader() {
  return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading...</div>;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AuthGuard>
          <NotesProvider>
            <LabelsProvider>
              <CollectionsProvider>
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/archive" element={<ArchivePage />} />
                      <Route path="/trash" element={<TrashPage />} />
                      <Route path="/c/:slug" element={<CollectionPage />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </CollectionsProvider>
            </LabelsProvider>
          </NotesProvider>
        </AuthGuard>
      </AuthProvider>
    </HashRouter>
  );
}
