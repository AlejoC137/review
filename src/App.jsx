import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RoadmapProvider } from './context/RoadmapContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ModuleView from './pages/ModuleView';
import ResourceDetailView from './pages/ResourceDetailView';
import ResourceLabPage from './pages/ResourceLabPage';
import UserCreationForm from './pages/UserCreationForm';
import AboutUs from './pages/AboutUs';
import Documents from './pages/Documents';
import AdminProtectedRoute from './components/auth/AdminProtectedRoute';

import LifecycleDashboard from './pages/LifecycleDashboard';
import ProjectDetailView from './pages/ProjectDetailView';
import DictionaryView from './pages/DictionaryView';
import EsquemasView from './pages/EsquemasView';
import BimAssistant from './components/ui/BimAssistant';
import MainLayout from './components/layout/MainLayout';
import PlannerView from './pages/PlannerView';
import DriveTestPage from './pages/DriveTestPage';
import AdminResourceLabPage from './pages/AdminResourceLabPage';
import AdminResourceDetailView from './pages/AdminResourceDetailView';
import MaterialsView from './pages/MaterialsView';
import SpacesView from './pages/SpacesView';
import ComponentsView from './pages/ComponentsView';
import ProtocolPrintView from './pages/ProtocolPrintView';

function App() {
  return (
    <AuthProvider>
      <RoadmapProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/" element={<LifecycleDashboard />} />
              <Route path="/roadmap" element={<Dashboard />} />

              <Route path="/projects" element={<Navigate to="/" replace />} />

              <Route path="/project/:projectId" element={<ProjectDetailView />} />

              <Route path="/module/:moduleId" element={<ModuleView />} />

              <Route path="/resources" element={<ResourceLabPage />} />

              <Route path="/resource/:resourceId" element={<ResourceDetailView />} />
              <Route path="/resourceView/:resourceId" element={<ResourceDetailView />} />
              
              <Route path="/print/protocol/:protocolId" element={<ProtocolPrintView />} />

              <Route path="/about" element={<AboutUs />} />

              <Route path="/dictionary" element={<DictionaryView />} />

              <Route path="/materials" element={<MaterialsView />} />

              <Route path="/spaces" element={<SpacesView />} />
              <Route path="/components" element={<ComponentsView />} />

              <Route path="/planner" element={<PlannerView />} />

              <Route path="/planner/:schemaId" element={<PlannerView />} />

              <Route path="/documents" element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              } />

              <Route path="/admin/resources" element={
                <AdminProtectedRoute>
                  <AdminResourceLabPage />
                </AdminProtectedRoute>
              } />

              <Route path="/admin/resourceEdit/:resourceId" element={<AdminResourceDetailView />} />

              <Route path="/esquemas" element={<EsquemasView isAdminView={false} />} />
              <Route path="/esquemas/:schemaId" element={<EsquemasView isAdminView={false} />} />
              <Route path="/esquemaView" element={<EsquemasView isAdminView={false} />} />
              <Route path="/esquemaView/:schemaId" element={<EsquemasView isAdminView={false} />} />

              <Route path="/esquemaEdit" element={<EsquemasView isAdminView={true} />} />
              <Route path="/esquemaEdit/:schemaId" element={<EsquemasView isAdminView={true} />} />
            </Route>

            <Route path="/admin/user-create" element={<UserCreationForm />} />

            <Route path="/drive-test" element={<DriveTestPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BimAssistant />
        </Router>
      </RoadmapProvider>
    </AuthProvider>
  );
}

export default App;
