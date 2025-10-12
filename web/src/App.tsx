import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth'
import { LoginPage, RegisterPage, InboxPage, ComposePage, SettingsPage, ThreadPage } from './pages'
import { SearchPage } from './pages/Search'
import LabelsPage from './pages/Labels'
import { StarredPage } from './pages/Starred'
import { AllMailPage } from './pages/AllMail'
import { SnoozedPage } from './pages/Snoozed'
import { ImportantPage } from './pages/Important'
import { SentPage } from './pages/Sent'
import { DraftsPage } from './pages/Drafts'
import { SpamPage } from './pages/Spam'
import { TrashPage } from './pages/Trash'
import { CalendarPage } from './pages/Calendar'
import { ContactsPage } from './pages/Contacts'
import { DrivePage } from './pages/Drive'
import { DashboardLayout } from './components/DashboardLayout'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/inbox" /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/inbox" /> : <RegisterPage />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/inbox" /> : <Navigate to="/login" />}
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Navigate to="/inbox" /> : <Navigate to="/login" />}
        />
        <Route 
          path="/inbox" 
          element={isAuthenticated ? <DashboardLayout><InboxPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/compose" 
          element={isAuthenticated ? <DashboardLayout><ComposePage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/thread/:threadId" 
          element={isAuthenticated ? <DashboardLayout><ThreadPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <DashboardLayout><SettingsPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/search" 
          element={isAuthenticated ? <DashboardLayout><SearchPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/labels" 
          element={isAuthenticated ? <DashboardLayout><LabelsPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/starred" 
          element={isAuthenticated ? <DashboardLayout><StarredPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/all" 
          element={isAuthenticated ? <DashboardLayout><AllMailPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/snoozed" 
          element={isAuthenticated ? <DashboardLayout><SnoozedPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/important" 
          element={isAuthenticated ? <DashboardLayout><ImportantPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/sent" 
          element={isAuthenticated ? <DashboardLayout><SentPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/drafts" 
          element={isAuthenticated ? <DashboardLayout><DraftsPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/spam" 
          element={isAuthenticated ? <DashboardLayout><SpamPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/trash" 
          element={isAuthenticated ? <DashboardLayout><TrashPage /></DashboardLayout> : <Navigate to="/login" />}
        />
        <Route 
          path="/calendar" 
          element={isAuthenticated ? <CalendarPage /> : <Navigate to="/login" />}
        />
        <Route 
          path="/contacts" 
          element={isAuthenticated ? <ContactsPage /> : <Navigate to="/login" />}
        />
        <Route 
          path="/drive" 
          element={isAuthenticated ? <DrivePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  )
}

export default App