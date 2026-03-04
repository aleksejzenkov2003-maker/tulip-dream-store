import { useCart } from '@/lib/cart';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Cart = () => {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h1 className="font-display text-3xl font-bold mb-2">Корзина пуста</h1>
        <p className="font-body text-muted-foreground mb-6">Добавьте тюльпаны из каталога</p>
        <Button asChild className="rounded-full">
          <Link to="/catalog">Перейти в каталог</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex items-center gap-4 bg-card rounded-2xl p-4 shadow-sm"
              >
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-tulip-cream flex-shrink-0">
                  {item.photo_url ? (
                    <img src={item.photo_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🌷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold truncate">{item.name}</h3>
                  <p className="font-body text-sm text-primary font-bold">{item.price} ₽</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-body font-semibold w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-display font-bold text-lg w-24 text-right">{item.price * item.quantity} ₽</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-sm h-fit sticky top-24">
          <h2 className="font-display text-xl font-bold mb-4">Итого</h2>
          <div className="flex justify-between font-body text-lg mb-6">
            <span>Сумма</span>
            <span className="font-bold text-primary">{totalPrice()} ₽</span>
          </div>
          <Button asChild size="lg" className="w-full rounded-full">
            <Link to="/checkout">Оформить заявку <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
