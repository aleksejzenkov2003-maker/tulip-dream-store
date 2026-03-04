import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/ProductCard';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const CATEGORIES = ['все', 'букеты', 'штучные', 'композиции'];

const Catalog = () => {
  const [category, setCategory] = useState('все');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category],
    queryFn: async () => {
      let q = supabase.from('products').select('*').order('created_at', { ascending: false });
      if (category !== 'все') q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">Каталог</h1>
        <p className="font-body text-muted-foreground mb-8">Свежие тюльпаны с доставкой по Москве</p>
      </motion.div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={category === c ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(c)}
            className="rounded-full capitalize"
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🌷</span>
          <p className="font-body text-muted-foreground">Товары скоро появятся!</p>
        </div>
      )}
    </div>
  );
};

export default Catalog;
