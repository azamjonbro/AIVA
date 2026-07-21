import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Bot,
  LayoutDashboard,
  MessageSquareCode,
  Package,
  Users,
  Award,
  History,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  CheckCheck,
  UserCheck,
  Menu,
  X,
  BookOpen,
  Cable
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, company, logout, notifications, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Agent', path: '/dashboard/agent', icon: MessageSquareCode },
    { name: 'Products', path: '/dashboard/products', icon: Package },
    { name: 'Knowledge Base', path: '/dashboard/knowledge', icon: BookOpen },
    { name: 'Customers CRM', path: '/dashboard/crm', icon: Users },
    { name: 'Leads', path: '/dashboard/leads', icon: Award },
    { name: 'Conversations', path: '/dashboard/conversations', icon: History },
    { name: 'Employees', path: '/dashboard/employees', icon: UserCheck },
    { name: 'Integrations', path: '/dashboard/integrations', icon: Cable },
    { name: 'Analytics', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Background radial accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Top Header */}
      <header className="h-16 border-b border-gray-900 bg-gray-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
            className="p-1 text-gray-400 hover:text-white md:hidden cursor-pointer"
          >
            {isSidebarMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-wider text-white">
            <span className="p-1.5 bg-indigo-600 rounded flex items-center justify-center">
              <Bot className="h-4.5 w-4.5 text-white" />
            </span>
            <span>AIVA</span>
          </Link>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-900 border border-gray-800 text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
            {company?.category || 'SaaS'}
          </span>
        </div>

        <div className="flex items-center gap-6 relative">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition relative cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-gray-950 animate-ping"></span>
              )}
            </button>

            {/* Notification Dropdown Pane */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl p-4 z-50 glass-panel">
                <div className="flex items-center justify-between pb-3 border-b border-gray-900 mb-3">
                  <h4 className="font-bold text-sm text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-3">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-xl text-left border ${
                          notif.read
                            ? 'bg-transparent border-transparent'
                            : 'bg-indigo-950/10 border-indigo-500/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="font-semibold text-xs text-white">{notif.title}</h5>
                          <span className="text-[9px] text-gray-500">{notif.time}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{notif.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-900">
            <div className="h-8 w-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="hidden md:block text-left">
              <h5 className="text-xs font-semibold text-white leading-tight">{user?.name}</h5>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">{company?.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex relative">
        {/* Sidebar Left Drawer (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-gray-900 bg-gray-950/30 shrink-0 p-4 justify-between relative z-20">
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </aside>

        {/* Sidebar Mobile Drawer */}
        {isSidebarMobileOpen && (
          <aside className="md:hidden fixed inset-0 top-16 bg-gray-950/90 z-30 flex flex-col justify-between p-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsSidebarMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                        : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => {
                setIsSidebarMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/5 transition w-full text-left cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </aside>
        )}

        {/* Content Panel Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full relative z-10 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
