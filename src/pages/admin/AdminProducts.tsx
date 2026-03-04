import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

const CATEGORIES = ['букеты', 'штучные', 'композиции'];

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  in_stock: boolean;
  photo_url: string;
};

const emptyForm: ProductForm = { name: '', description: '', price: '', category: 'букеты', in_stock: true, photo_url: '' };

const AdminProducts = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploading, setUploading] = useState(false);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseInt(form.price),
        category: form.category,
        in_stock: form.in_stock,
        photo_url: form.photo_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: editingId ? 'Товар обновлён' : 'Товар добавлен' });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (err: any) => toast({ title: 'Ошибка', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Товар удалён' });
    },
  });

  const handleEdit = (p: Tables<'products'>) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category, in_stock: p.in_stock, photo_url: p.photo_url || '' });
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-photos').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-photos').getPublicUrl(path);
      setForm((f) => ({ ...f, photo_url: data.publicUrl }));
      toast({ title: 'Фото загружено' });
    } catch (err: any) {
      toast({ title: 'Ошибка загрузки', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Товары</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> Добавить</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editingId ? 'Редактировать' : 'Новый товар'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" required />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Цена (₽)</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl mt-1" required min="1" />
                </div>
                <div>
                  <Label>Категория</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Фото</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} className="rounded-xl" placeholder="URL или загрузите" />
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    <Button type="button" variant="outline" size="icon" className="rounded-xl" asChild disabled={uploading}>
                      <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                    </Button>
                  </label>
                </div>
                {form.photo_url && <img src={form.photo_url} alt="" className="mt-2 h-24 rounded-xl object-cover" />}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
                <Label>В наличии</Label>
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Сохранить' : 'Добавить'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-10 animate-pulse font-body">Загрузка...</div>
      ) : products && products.length > 0 ? (
        <div className="grid gap-4">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-tulip-cream flex-shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🌷</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold truncate">{p.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{p.category} · {p.in_stock ? 'В наличии' : 'Нет'}</p>
              </div>
              <span className="font-display font-bold text-primary">{p.price} ₽</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-muted-foreground text-center py-10">Товаров пока нет. Добавьте первый!</p>
      )}
    </div>
  );
};

export default AdminProducts;
