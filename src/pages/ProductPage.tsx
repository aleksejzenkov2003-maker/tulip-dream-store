import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import { ShoppingBag, ArrowLeft, Minus, Plus, Truck, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ProductCard from '@/components/ProductCard';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const addItem = useCart((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: related } = useQuery({
    queryKey: ['related-products', product?.category, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', product!.category)
        .neq('id', id!)
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!product,
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

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        photo_url: product.photo_url,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link to="/catalog" className="font-body text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
        <ArrowLeft className="h-4 w-4" /> Назад в каталог
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        {/* Photo */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="aspect-square rounded-2xl overflow-hidden bg-tulip-cream sticky top-24">
            {product.photo_url ? (
              <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-8xl">🌷</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {product.category}
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>

          {product.description && (
            <p className="font-body text-muted-foreground mb-6 leading-relaxed text-base">
              {product.description}
            </p>
          )}

          <p className="font-display text-4xl font-bold text-primary mb-6">{product.price} ₽</p>

          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="font-body text-sm text-muted-foreground">Количество:</span>
            <div className="flex items-center gap-0 border rounded-full overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-display font-bold text-lg w-10 text-center">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-none"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="font-body text-sm text-muted-foreground">
              Итого: <strong className="text-foreground">{product.price * quantity} ₽</strong>
            </span>
          </div>

          {/* Add to cart */}
          <Button
            size="lg"
            onClick={handleAddToCart}
            disabled={!product.in_stock}
            className="rounded-full w-full sm:w-fit text-base px-10 mb-8"
          >
            <ShoppingBag className="mr-2 h-5 w-5" />
            {product.in_stock ? 'В корзину' : 'Нет в наличии'}
          </Button>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold">Доставка</p>
                <p className="font-body text-xs text-muted-foreground">По Москве за 2ч</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold">Гарантия</p>
                <p className="font-body text-xs text-muted-foreground">Свежесть 5 дней</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-body text-sm font-semibold">Время работы</p>
                <p className="font-body text-xs text-muted-foreground">08:00 — 21:00</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">Похожие товары</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
