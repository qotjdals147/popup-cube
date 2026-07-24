import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { MobileShell } from './components/MobileShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CreateStorePage } from './pages/CreateStorePage';
import { StorePage } from './pages/StorePage';
import { MyPage } from './pages/MyPage';

function AppRoutes() {
  return (
    <MobileShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/store/create" element={<CreateStorePage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/store/:storeId" element={<StorePage />} />
      </Routes>
    </MobileShell>
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
