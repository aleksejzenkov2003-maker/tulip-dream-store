import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Props {
  onRegistered: (sessionId: string) => void;
}

const ChatRegistration = ({ onRegistered }: Props) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !agreed) return;

    setLoading(true);
    const { data, error } = await supabase.from('chat_sessions').insert({
      customer_name: name.trim(),
      phone: phone.trim(),
    }).select('id').single();

    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось начать чат', variant: 'destructive' });
      setLoading(false);
      return;
    }

    onRegistered(data.id);
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-center px-6 py-4 gap-4">
      <div className="text-center mb-2">
        <p className="text-lg font-semibold">👋 Добро пожаловать!</p>
        <p className="text-sm text-muted-foreground">Представьтесь, и наш ИИ-консультант поможет вам выбрать идеальный букет</p>
      </div>
      <Input placeholder="Ваше имя" value={name} onChange={e => setName(e.target.value)} required />
      <Input placeholder="Телефон" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
      <div className="flex items-start gap-2">
        <Checkbox id="privacy" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
        <label htmlFor="privacy" className="text-xs text-muted-foreground leading-tight cursor-pointer">
          Я принимаю{' '}
          <Link to="/privacy" target="_blank" className="underline text-primary">политику конфиденциальности</Link>
        </label>
      </div>
      <Button type="submit" disabled={!name.trim() || !phone.trim() || !agreed || loading} className="rounded-full">
        {loading ? 'Подключаем...' : 'Начать чат 💬'}
      </Button>
    </form>
  );
};

export default ChatRegistration;
