import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotesProvider } from './context/NotesContext';
import { LabelsProvider } from './context/LabelsContext';
import { CollectionsProvider } from './context/CollectionsContext';
import AuthGuard from './components/auth/AuthGuard';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import TrashPage from './pages/TrashPage';
import ArchivePage from './pages/ArchivePage';
import CollectionPage from './pages/CollectionPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AuthGuard>
          <NotesProvider>
            <LabelsProvider>
              <CollectionsProvider>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/archive" element={<ArchivePage />} />
                    <Route path="/trash" element={<TrashPage />} />
                    <Route path="/c/:slug" element={<CollectionPage />} />
                  </Routes>
                </Layout>
              </CollectionsProvider>
            </LabelsProvider>
          </NotesProvider>
        </AuthGuard>
      </AuthProvider>
    </HashRouter>
  );
}
