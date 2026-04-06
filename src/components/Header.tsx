import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Moon, Sun } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const totalItems = useCart((s) => s.totalItems());
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') setDark(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Переключить тему"
          >
            {dark ? <Sun className="h-5 w-5 text-foreground" /> : <Moon className="h-5 w-5 text-foreground" />}
          </button>
          <Link to="/" className="font-display text-2xl font-bold text-primary">
            🌷 Тюльпаны
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/catalog" className="font-body text-sm font-medium hover:text-primary transition-colors">
            Каталог
          </Link>
          <Link to="/delivery" className="font-body text-sm font-medium hover:text-primary transition-colors">
            Доставка
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingBag className="h-5 w-5 text-foreground hover:text-primary transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-body font-bold">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-4">
          <Link to="/cart" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-body font-bold">
                {totalItems}
              </span>
            )}
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-background"
          >
            <nav className="flex flex-col p-4 gap-4">
              <Link to="/catalog" onClick={() => setMenuOpen(false)} className="font-body text-sm font-medium">
                Каталог
              </Link>
              <Link to="/delivery" onClick={() => setMenuOpen(false)} className="font-body text-sm font-medium">
                Доставка
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
