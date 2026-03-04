import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

const STATUSES = ['новый', 'в работе', 'доставлен', 'отменён'];

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

const AdminOrders = () => {
  const qc = useQueryClient();

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

  const parseItems = (items: Json): OrderItem[] => {
    if (Array.isArray(items)) return items as unknown as OrderItem[];
    return [];
  };

  if (isLoading) return <div className="text-center py-10 animate-pulse font-body">Загрузка...</div>;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Заявки</h1>
      {orders && orders.length > 0 ? (
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Адрес</TableHead>
                <TableHead>Состав</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-body text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell className="font-body text-sm font-medium">{order.customer_name}</TableCell>
                  <TableCell className="font-body text-sm">{order.phone}</TableCell>
                  <TableCell className="font-body text-xs max-w-[150px] truncate">{order.address}</TableCell>
                  <TableCell className="font-body text-xs max-w-[200px]">
                    {parseItems(order.items).map((item, i) => (
                      <div key={i}>{item.name} × {item.quantity}</div>
                    ))}
                  </TableCell>
                  <TableCell className="font-body font-bold">{order.total} ₽</TableCell>
                  <TableCell>
                    <Select value={order.status} onValueChange={(val) => updateStatus.mutate({ id: order.id, status: val })}>
                      <SelectTrigger className="w-[130px] rounded-full text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="font-body text-muted-foreground text-center py-10">Заявок пока нет</p>
      )}
    </div>
  );
};

export default AdminOrders;
