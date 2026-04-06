import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

const STATUSES = ['новый', 'в работе', 'доставлен', 'отменён'];

const statusColor: Record<string, string> = {
  'новый': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'в работе': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'доставлен': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'отменён': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

const AdminOrders = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Статус обновлён' });
    },
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Заказ удалён' });
    },
  });

  const parseItems = (items: Json): OrderItem[] => {
    if (Array.isArray(items)) return items as unknown as OrderItem[];
    return [];
  };

  const filtered = orders?.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || o.phone.includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="text-center py-10 animate-pulse font-body">Загрузка...</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Заявки</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени или телефону" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-full">
            <SelectValue placeholder="Все статусы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered && filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((order) => {
            const expanded = expandedId === order.id;
            const items = parseItems(order.items);
            return (
              <div key={order.id} className="bg-card rounded-2xl shadow-sm overflow-hidden border border-border">
                <button
                  type="button"
                  className="w-full text-left p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Клиент</p>
                      <p className="font-body text-sm font-medium truncate">{order.customer_name}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Телефон</p>
                      <p className="font-body text-sm truncate">{order.phone}</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Сумма</p>
                      <p className="font-display font-bold">{order.total} ₽</p>
                    </div>
                    <div>
                      <p className="font-body text-xs text-muted-foreground">Дата</p>
                      <p className="font-body text-xs">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                    </div>
                  </div>
                  <Badge className={`${statusColor[order.status] || ''} border-0 whitespace-nowrap`}>{order.status}</Badge>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-body text-xs text-muted-foreground mb-1">Адрес</p>
                        <p className="font-body text-sm">{order.address}</p>
                      </div>
                      {order.comment && (
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-1">Комментарий</p>
                          <p className="font-body text-sm">{order.comment}</p>
                        </div>
                      )}
                      {order.delivery_date && (
                        <div>
                          <p className="font-body text-xs text-muted-foreground mb-1">Дата доставки</p>
                          <p className="font-body text-sm">{order.delivery_date} {order.delivery_time && `в ${order.delivery_time}`}</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="font-body text-xs text-muted-foreground mb-2">Состав заказа</p>
                      <div className="bg-muted rounded-xl p-3 space-y-1">
                        {items.map((item, i) => (
                          <div key={i} className="flex justify-between font-body text-sm">
                            <span>{item.name} × {item.quantity}</span>
                            <span className="text-muted-foreground">{item.price * item.quantity} ₽</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Select value={order.status} onValueChange={(val) => updateStatus.mutate({ id: order.id, status: val })}>
                        <SelectTrigger className="w-[160px] rounded-full text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive rounded-full ml-auto">
                            <Trash2 className="h-4 w-4 mr-1" /> Удалить
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить заказ?</AlertDialogTitle>
                            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
                            <AlertDialogAction className="rounded-full" onClick={() => deleteOrder.mutate(order.id)}>Удалить</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-body text-muted-foreground text-center py-10">
          {search || statusFilter !== 'all' ? 'Ничего не найдено' : 'Заявок пока нет'}
        </p>
      )}
    </div>
  );
};

export default AdminOrders;
