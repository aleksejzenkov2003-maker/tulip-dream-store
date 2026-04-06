import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Search, ArrowLeft, AlertTriangle, Bot, UserRound } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Активный', variant: 'default' },
  escalated: { label: 'Тикет', variant: 'destructive' },
  closed: { label: 'Закрыт', variant: 'secondary' },
};

const AdminChats = () => {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: sessions = [] } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', selectedSession],
    queryFn: async () => {
      if (!selectedSession) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSession,
  });

  const filtered = sessions.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.customer_name.toLowerCase().includes(q) || s.phone.includes(q);
    }
    return true;
  });

  if (selectedSession) {
    const session = sessions.find(s => s.id === selectedSession);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-1" /> Назад
          </Button>
          {session && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{session.customer_name}</span>
              <span className="text-muted-foreground text-sm">{session.phone}</span>
              <Badge variant={statusConfig[session.status]?.variant || 'outline'}>
                {statusConfig[session.status]?.label || session.status}
              </Badge>
            </div>
          )}
        </div>
        <div className="bg-card rounded-xl border border-border p-4 max-h-[65vh] overflow-y-auto space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role !== 'user' && (
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  {msg.role === 'system' ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
                </div>
              )}
              <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
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
                <span className="text-[10px] opacity-60 mt-1 block">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: ru })}
                </span>
              </div>
              {msg.role === 'user' && (
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <UserRound className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Сообщений пока нет</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">💬 Чаты</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени или телефону..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-full" />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'escalated', label: 'Тикеты' },
            { key: 'closed', label: 'Закрытые' },
          ].map(f => (
            <Button key={f.key} variant={statusFilter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(f.key)} className="rounded-full">
              {f.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map(session => (
          <button
            key={session.id}
            onClick={() => setSelectedSession(session.id)}
            className={`w-full text-left p-4 rounded-xl border transition-colors hover:bg-accent/50 ${
              session.status === 'escalated' ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  session.status === 'escalated' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  {session.status === 'escalated' ? (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  ) : (
                    <MessageCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{session.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{session.phone}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <Badge variant={statusConfig[session.status]?.variant || 'outline'} className="text-xs">
                  {statusConfig[session.status]?.label || session.status}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {format(new Date(session.updated_at), 'dd.MM HH:mm', { locale: ru })}
                </span>
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Чатов пока нет</p>
        )}
      </div>
    </div>
  );
};

export default AdminChats;
