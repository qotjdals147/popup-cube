import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CreateStorePage } from './pages/CreateStorePage';
import { StoreEditPage } from './pages/StoreEditPage';
import { StorePage } from './pages/StorePage';
import { PlayWorldPage } from './pages/PlayWorldPage';
import { AppOnlyPage } from './pages/AppOnlyPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/app-only" element={<AppOnlyPage />} />
      <Route path="/store/create" element={<CreateStorePage />} />
      <Route path="/store/:storeId/edit" element={<StoreEditPage />} />
      {/* 모바일 앱 WebView 전용 플레이 월드 (Sprint 4-1) — AD-037 손님 채널 */}
      <Route path="/play/:storeId" element={<PlayWorldPage />} />
      <Route path="/mypage" element={<Navigate to="/app-only" replace />} />
      <Route path="/store/:storeId" element={<StorePage />} />
    </Routes>
  );
}

export function App() {
  return (
    <ViewModeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ViewModeProvider>
  );
}
