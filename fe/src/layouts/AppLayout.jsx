import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Sparkles, User as UserIcon } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import LoginPromptModal from '../components/LoginPromptModal';
import { useApp } from '../context/AppContext';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user } = useApp();

  return (
    <div className="drawer min-h-screen bg-base-100">
      <input
        id="app-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={drawerOpen}
        onChange={(e) => setDrawerOpen(e.target.checked)}
      />

      {/* Main Page Layout Wrapper */}
      <div className="drawer-content flex min-h-screen">
        {/* Desktop Sidebar (Persistent: expands to w-64 or collapses to w-16 icon rail) */}
        <div className="hidden lg:block h-screen sticky top-0 shrink-0">
          <Sidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        </div>

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          {/* Top Bar (No border line as requested: "hilangkan gari navbar") */}
          <header className="navbar bg-base-100 px-3 sm:px-4 sticky top-0 z-20">
            <div className="flex-none flex items-center gap-1">
              {/* Mobile drawer toggle button */}
              <label
                htmlFor="app-drawer"
                className="btn btn-square btn-ghost btn-sm lg:hidden drawer-button"
                aria-label="Open sidebar"
                title="Buka Sidebar"
              >
                <Menu className="w-5 h-5" />
              </label>

              {/* Mobile brand title */}
              <div className="lg:hidden ml-1">
                <Link to="/explore" className="flex items-center gap-2 font-bold text-base hover:text-primary transition-colors">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Alistair</span>
                </Link>
              </div>
            </div>

            <div className="flex-1 px-2"></div>

            <div className="flex-none flex items-center gap-2">
              {/* DaisyUI theme controller for Light/Dark Mode */}
              <ThemeToggle />

              {/* Profile link */}
              <Link
                to={user?.isLoggedIn ? '/settings' : '/login'}
                className="btn btn-ghost btn-circle btn-sm"
                title={user?.isLoggedIn ? user.name : 'Login'}
              >
                {user?.isLoggedIn ? (
                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </Link>
            </div>
          </header>

          {/* Content Outlet */}
          <main className="flex-1 flex flex-col relative overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Drawer Slide-over Side */}
      <div className="drawer-side lg:hidden z-30">
        <label
          htmlFor="app-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        ></label>
        <Sidebar
          isCollapsed={false}
          onCloseMobile={() => setDrawerOpen(false)}
          onToggleCollapse={() => setDrawerOpen(false)}
        />
      </div>

      {/* Global Login Prompt Dialog */}
      <LoginPromptModal />
    </div>
  );
}
