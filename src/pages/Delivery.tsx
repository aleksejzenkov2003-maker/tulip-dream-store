import { motion } from 'framer-motion';
import { Truck, Clock, MapPin } from 'lucide-react';

const Delivery = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Доставка</h1>
        <p className="font-body text-muted-foreground mb-12 max-w-xl">
          Мы доставляем свежие тюльпаны по Москве ежедневно. Каждый букет упакован с заботой и сохраняет свежесть при транспортировке.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { icon: MapPin, title: 'Зона доставки', desc: 'Доставляем по всей Москве в пределах МКАД. Доставка за МКАД — по договорённости.' },
          { icon: Clock, title: 'Время доставки', desc: 'Доставка в течение 2 часов с момента подтверждения заказа. Работаем с 8:00 до 21:00.' },
          { icon: Truck, title: 'Стоимость', desc: 'Бесплатная доставка при заказе от 3000 ₽. В остальных случаях — 500 ₽.' },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-card rounded-2xl p-8 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-tulip-cream mb-4">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-tulip-cream rounded-2xl p-8">
        <h2 className="font-display text-2xl font-bold mb-4">Важная информация</h2>
        <ul className="font-body text-sm text-muted-foreground space-y-3 leading-relaxed">
          <li>• Заказы принимаются ежедневно с 8:00 до 20:00</li>
          <li>• Минимальная сумма заказа — 1000 ₽</li>
          <li>• Возможна доставка к определённому времени (при заказе за 3 часа)</li>
          <li>• Оплата наличными или переводом курьеру при получении</li>
          <li>• При получении вы можете проверить букет</li>
        </ul>
      </div>
    </div>
  );
};

export default Delivery;
