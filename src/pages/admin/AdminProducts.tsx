import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Upload, Search, ImagePlus } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      qc.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Товар удалён' });
    },
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, in_stock }: { id: string; in_stock: boolean }) => {
      const { error } = await supabase.from('products').update({ in_stock }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleEdit = (p: Tables<'products'>) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category, in_stock: p.in_stock, photo_url: p.photo_url || '' });
    setDialogOpen(true);
  };

  const uploadFile = useCallback(async (file: File) => {
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
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }, [uploadFile]);

  const filtered = products?.filter((p) => {
    if (catFilter !== 'all' && p.category !== catFilter) return false;
    if (stockFilter === 'in' && !p.in_stock) return false;
    if (stockFilter === 'out' && p.in_stock) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
                <div
                  className={`mt-1 border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  ) : form.photo_url ? (
                    <img src={form.photo_url} alt="" className="h-32 mx-auto rounded-xl object-cover" />
                  ) : (
                    <div className="text-muted-foreground">
                      <ImagePlus className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Перетащите фото или нажмите для загрузки</p>
                    </div>
                  )}
                </div>
                <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} className="rounded-xl mt-2" placeholder="Или вставьте URL" />
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по названию" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="in">В наличии</SelectItem>
            <SelectItem value="out">Нет в наличии</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10 animate-pulse font-body">Загрузка...</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm border border-border">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🌷</div>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold truncate">{p.name}</h3>
                <p className="font-body text-xs text-muted-foreground">{p.category}</p>
              </div>
              <span className="font-display font-bold text-primary whitespace-nowrap">{p.price} ₽</span>
              <div className="flex items-center gap-1">
                <Switch checked={p.in_stock} onCheckedChange={(v) => toggleStock.mutate({ id: p.id, in_stock: v })} />
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить товар «{p.name}»?</AlertDialogTitle>
                      <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
                      <AlertDialogAction className="rounded-full" onClick={() => deleteMutation.mutate(p.id)}>Удалить</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body text-muted-foreground text-center py-10">
          {search || catFilter !== 'all' || stockFilter !== 'all' ? 'Ничего не найдено' : 'Товаров пока нет. Добавьте первый!'}
        </p>
      )}
    </div>
  );
};

export default AdminProducts;
