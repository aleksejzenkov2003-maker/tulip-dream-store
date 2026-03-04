import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';

const checkoutSchema = z.object({
  name: z.string().trim().min(1, 'Введите имя').max(100),
  phone: z.string().trim().min(6, 'Введите телефон').max(20),
  address: z.string().trim().min(3, 'Введите адрес').max(300),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  comment: z.string().max(500).optional(),
});

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', deliveryDate: '', deliveryTime: '', comment: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0 && !success) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = checkoutSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('orders').insert({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        delivery_date: form.deliveryDate || null,
        delivery_time: form.deliveryTime || null,
        comment: form.comment?.trim() || null,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        total: totalPrice(),
      });
      if (error) throw error;
      clearCart();
      setSuccess(true);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить заявку. Попробуйте позже.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle className="h-20 w-20 text-accent-foreground mx-auto mb-4" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-2">Заявка отправлена!</h1>
        <p className="font-body text-muted-foreground mb-6">Мы свяжемся с вами в течение 15 минут для подтверждения заказа</p>
        <Button onClick={() => navigate('/')} className="rounded-full">На главную</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <h1 className="font-display text-3xl font-bold mb-8">Оформление заявки</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Label htmlFor="name">Имя *</Label>
          <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" placeholder="Ваше имя" />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="phone">Телефон *</Label>
          <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl mt-1" placeholder="+7 (999) 123-45-67" />
          {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
        </div>
        <div>
          <Label htmlFor="address">Адрес доставки *</Label>
          <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl mt-1" placeholder="Москва, ул. ..." />
          {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Дата доставки</Label>
            <Input id="date" type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} className="rounded-xl mt-1" />
          </div>
          <div>
            <Label htmlFor="time">Время</Label>
            <Input id="time" type="time" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} className="rounded-xl mt-1" />
          </div>
        </div>
        <div>
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} className="rounded-xl mt-1" placeholder="Пожелания к заказу..." />
        </div>

        <div className="bg-tulip-cream rounded-2xl p-4">
          <div className="flex justify-between font-body text-lg">
            <span>Итого ({items.length} поз.)</span>
            <span className="font-bold text-primary">{totalPrice()} ₽</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Отправить заявку
        </Button>
      </form>
    </div>
  );
};

export default Checkout;
