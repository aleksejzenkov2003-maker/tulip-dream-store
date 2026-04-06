import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, UserRound, Bot, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Props {
  sessionId: string;
}

const ChatMessages = ({ sessionId }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing messages
    const load = async () => {
      const { data } = await supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at');
      if (data) setMessages(data);
    };
    load();

    // Subscribe to new messages via realtime
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === (payload.new as Message).id)) return prev;
          return [...prev, payload.new as Message];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка');
      }

      const data = await resp.json();
      if (data.order_created) {
        toast({ title: '🎉 Заказ оформлен!', description: 'Менеджер свяжется с вами для подтверждения' });
      }
    } catch (e: any) {
      toast({ title: 'Ошибка', description: e.message || 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    await supabase.from('chat_sessions').update({ status: 'escalated' }).eq('id', sessionId);
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'system',
      content: '⚠️ Клиент запросил помощь оператора. Менеджер скоро подключится.',
    });
    toast({ title: 'Оператор уведомлён', description: 'Менеджер скоро подключится к чату' });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-8">
            <Bot className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p>Привет! Я помогу вам выбрать идеальный букет 🌷</p>
            <p className="mt-1">Расскажите, какой повод или что вы ищете?</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                {msg.role === 'system' ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : msg.role === 'system'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                  : 'bg-muted rounded-bl-md'
            }`}>
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none [&>p]:m-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                <UserRound className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex gap-2 mb-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Напишите сообщение..."
            disabled={loading}
            className="rounded-full text-sm"
          />
          <Button size="icon" onClick={sendMessage} disabled={!input.trim() || loading} className="rounded-full flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <button onClick={escalate} className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center">
          Позвать оператора
        </button>
      </div>
    </div>
  );
};

export default ChatMessages;
