import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ClipboardList, Package, TrendingUp, Calendar } from 'lucide-react';

const AdminDashboard = () => {
  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      return data;
    },
  });

  const totalSales = orders?.reduce((s, o) => s + o.total, 0) ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = orders?.filter((o) => o.created_at.slice(0, 10) === today).reduce((s, o) => s + o.total, 0) ?? 0;

  const statusCounts: Record<string, number> = {};
  orders?.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const statusLabels: Record<string, { label: string; color: string }> = {
    'новый': { label: 'Новые', color: 'text-blue-600' },
    'в работе': { label: 'В работе', color: 'text-yellow-600' },
    'доставлен': { label: 'Доставлены', color: 'text-green-600' },
    'отменён': { label: 'Отменены', color: 'text-red-600' },
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Дашборд</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Заказов</CardTitle>
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{orders?.length ?? 0}</p></CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2"><Package className="h-4 w-4" /> Товаров</CardTitle>
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{products?.length ?? 0}</p></CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Продажи</CardTitle>
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{totalSales.toLocaleString('ru-RU')} ₽</p></CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-body text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Сегодня</CardTitle>
          </CardHeader>
          <CardContent><p className="font-display text-3xl font-bold">{todaySales.toLocaleString('ru-RU')} ₽</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display text-lg">Заказы по статусам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(statusLabels).map(([key, { label, color }]) => (
              <div key={key} className="flex justify-between font-body">
                <span>{label}</span>
                <span className={`font-bold ${color}`}>{statusCounts[key] || 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display text-lg">Быстрые ссылки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/orders" className="block p-3 rounded-xl bg-muted hover:bg-accent transition-colors font-body text-sm">
              📋 Управление заказами
            </Link>
            <Link to="/admin/products" className="block p-3 rounded-xl bg-muted hover:bg-accent transition-colors font-body text-sm">
              📦 Управление товарами
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
