import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const addItem = useCart((s) => s.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-20 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="font-body text-muted-foreground">Товар не найден</p>
        <Button asChild variant="outline" className="mt-4 rounded-full">
          <Link to="/catalog">Вернуться в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link to="/catalog" className="font-body text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Назад в каталог
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square rounded-2xl overflow-hidden bg-tulip-cream">
            {product.photo_url ? (
              <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">🌷</span>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {product.category}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
          <p className="font-body text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
          <p className="font-display text-4xl font-bold text-primary mb-8">{product.price} ₽</p>
          <Button
            size="lg"
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                photo_url: product.photo_url,
              })
            }
            disabled={!product.in_stock}
            className="rounded-full w-fit text-base px-8"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {product.in_stock ? 'В корзину' : 'Нет в наличии'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductPage;
