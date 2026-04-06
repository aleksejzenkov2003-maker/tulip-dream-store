import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, Truck, Flower2, Heart, Search } from "lucide-react";

const Index = () => {
  const { data: products } = useQuery({
    queryKey: ["products-featured"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("in_stock", true).limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-tulip-cream via-tulip-peach to-tulip-rose min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="font-body text-sm font-semibold text-primary uppercase tracking-widest">
                Доставка по Москве
              </span>
              <h1 className="font-display text-5xl md:text-7xl font-bold mt-4 mb-6 leading-tight">
                Свежие тюльпаны
                <br />
                <span className="text-primary italic">каждый день</span>
              </h1>
              <p className="font-body text-lg text-muted-foreground mb-8 max-w-md leading-relaxed">
                Мы отбираем лучшие тюльпаны голландской селекции и доставляем их к вашей двери в течение 2 часов
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button asChild size="lg" className="rounded-full text-base px-8">
                  <Link to="/catalog">
                    <Search className="mr-2 h-4 w-4" /> Смотреть каталог <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div
          className="absolute right-0 bottom-0 text-[200px] leading-none opacity-20 select-none pointer-events-none hidden lg:block"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          🌷
        </motion.div>
      </section>

      {/* Why us */}
      <section className="container mx-auto px-4 py-20">
        <motion.h2
          className="font-display text-3xl md:text-4xl font-bold text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Почему выбирают нас
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Flower2,
              title: "Свежесть",
              desc: "Тюльпаны напрямую из Голландии, хранятся в специальных холодильниках",
            },
            {
              icon: Truck,
              title: "Быстрая доставка",
              desc: "Доставим букет в течение 2 часов по Москве в пределах МКАД",
            },
            { icon: Heart, title: "С любовью", desc: "Каждый букет собирается вручную нашими флористами" },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="text-center p-8 rounded-2xl bg-card shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-tulip-cream mb-4">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {products && products.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-3xl font-bold">Хиты продаж</h2>
            <Link to="/catalog" className="font-body text-sm text-primary hover:underline flex items-center gap-1">
              Все товары <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-tulip-rose py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Хотите заказать букет?
          </h2>
          <p className="font-body text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Выберите тюльпаны из каталога и оформите заявку — мы свяжемся с вами в течение 15 минут
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full text-base px-8">
            <Link to="/catalog">Перейти в каталог</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
