import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Chat from './pages/Chat';
import Explore from './pages/Explore';
import BookDetail from './pages/BookDetail';
import Library from './pages/Library';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { useApp } from './context/AppContext';

function ProtectedChatRoute() {
  const { user, openLoginModal } = useApp();

  useEffect(() => {
    if (!user?.isLoggedIn) {
      openLoginModal();
    }
  }, [user, openLoginModal]);

  if (!user?.isLoggedIn) {
    return <Navigate to="/explore" replace />;
  }

  return <Chat />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Akses awal dimulai dari halaman explore */}
        <Route path="/" element={<Navigate to="/explore" replace />} />
        <Route path="/explore" element={<Explore />} />
        {/* Chat hanya bisa digunakan setelah login */}
        <Route path="/chat" element={<ProtectedChatRoute />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/library" element={<Library />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Route>
    </Routes>
  );
}
