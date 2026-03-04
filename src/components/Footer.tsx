import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-tulip-cream border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-xl font-bold text-primary mb-4">🌷 Тюльпаны</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Свежие тюльпаны с доставкой по Москве. Мы тщательно отбираем каждый цветок, чтобы ваш букет был идеальным.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Контакты</h4>
            <div className="font-body text-sm text-muted-foreground space-y-2">
              <p>📞 +7 (495) 123-45-67</p>
              <p>📧 hello@tulips-msk.ru</p>
              <p>📍 Москва, ул. Цветочная, 1</p>
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">Информация</h4>
            <div className="flex flex-col gap-2">
              <Link to="/delivery" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                Доставка
              </Link>
              <Link to="/privacy" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/offer" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                Публичная оферта
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="font-body text-xs text-muted-foreground">
            © {new Date().getFullYear()} Тюльпаны Москва. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
