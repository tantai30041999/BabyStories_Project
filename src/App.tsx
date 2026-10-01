import { Navigate, Route, Routes } from 'react-router'
import { I18nProvider } from './i18n'
import { ThemeProvider } from './store/ThemeContext'
import { ProfileProvider } from './store/ProfileContext'
import { LibraryProvider } from './store/LibraryContext'
import { UIProvider } from './store/UIContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Albums } from './pages/Albums'
import { AlbumPage } from './pages/AlbumPage'
import { Studio } from './pages/Studio'

export default function App() {
  return (
    <I18nProvider>
      <ProfileProvider>
        <ThemeProvider>
          <LibraryProvider>
            <UIProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="albums" element={<Albums />} />
                  <Route path="albums/:id" element={<AlbumPage kind="album" />} />
                  <Route path="months/:n" element={<AlbumPage kind="month" />} />
                  <Route path="studio" element={<Studio />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </UIProvider>
          </LibraryProvider>
        </ThemeProvider>
      </ProfileProvider>
    </I18nProvider>
  )
}
