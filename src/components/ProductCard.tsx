import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart';
import type { Tables } from '@/integrations/supabase/types';

interface ProductCardProps {
  product: Tables<'products'>;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCart((s) => s.addItem);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      photo_url: product.photo_url,
    });
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Link to={`/product/${product.id}`} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-[3/4] overflow-hidden">
            {product.photo_url ? (
              <img
                src={product.photo_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-tulip-cream flex items-center justify-center">
                <span className="text-6xl">🌷</span>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-display text-lg font-semibold mb-1 line-clamp-1">{product.name}</h3>
            <p className="font-body text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <span className="font-display text-xl font-bold text-primary">{product.price} ₽</span>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!product.in_stock}
                className="rounded-full"
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                {product.in_stock ? 'В корзину' : 'Нет в наличии'}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
