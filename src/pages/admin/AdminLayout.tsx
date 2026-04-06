import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Package, ClipboardList, LogOut } from 'lucide-react';

const AdminLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin'); setLoading(false); return; }
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!data) { await supabase.auth.signOut(); navigate('/admin'); setLoading(false); return; }
      setAuthorized(true);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setAuthorized(false); navigate('/admin'); }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="text-2xl animate-pulse">🌷</span></div>;
  }

  if (!authorized) return null;

  const navItems = [
    { to: '/admin/dashboard', label: 'Дашборд', icon: LayoutDashboard },
    { to: '/admin/orders', label: 'Заявки', icon: ClipboardList },
    { to: '/admin/products', label: 'Товары', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/admin/orders" className="font-display text-lg font-bold text-primary">🌷 Админка</Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button variant={location.pathname === item.to ? 'default' : 'ghost'} size="sm" className="rounded-full">
                    <item.icon className="h-4 w-4 mr-1" /> {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-full">
            <LogOut className="h-4 w-4 mr-1" /> Выйти
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
