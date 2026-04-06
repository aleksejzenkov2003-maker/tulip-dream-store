import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { session_id, message } = await req.json();
    if (!session_id || !message) {
      return new Response(JSON.stringify({ error: "session_id and message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save user message
    await supabase.from("chat_messages").insert({ session_id, role: "user", content: message });

    // Load products catalog
    const { data: products } = await supabase.from("products").select("name, price, category, in_stock, description").eq("in_stock", true);

    // Load chat history
    const { data: history } = await supabase.from("chat_messages").select("role, content").eq("session_id", session_id).order("created_at", { ascending: true });

    // Load session info
    const { data: session } = await supabase.from("chat_sessions").select("customer_name, phone").eq("id", session_id).single();

    const catalogText = (products || []).map(p => `- ${p.name} (${p.category}): ${p.price}₽ — ${p.description || "без описания"}`).join("\n");

    const systemPrompt = `Ты — приветливый консультант цветочного магазина "Цветочная лавка". 🌷
Твоя задача — помочь покупателю выбрать букет или собрать композицию из доступных цветов.

Каталог товаров в наличии:
${catalogText}

Информация о клиенте:
Имя: ${session?.customer_name || "Неизвестно"}
Телефон: ${session?.phone || "Неизвестно"}

Правила:
1. Будь дружелюбным и помогай выбрать подходящий букет, задавай уточняющие вопросы (повод, бюджет, предпочтения по цветам).
2. Рекомендуй товары ТОЛЬКО из каталога выше.
3. Когда клиент определился, подсчитай итоговую стоимость и предложи оформить заказ.
4. Для оформления заказа спроси адрес доставки, дату и время.
5. Когда все данные собраны и клиент подтверждает — вызови функцию create_order.
6. Отвечай коротко и по делу, используй эмодзи для дружелюбности.
7. Если вопрос не относится к цветам — вежливо перенаправь к теме.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "create_order",
          description: "Create a new order when the customer confirms their purchase",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" },
                  },
                  required: ["name", "price", "quantity"],
                },
              },
              total: { type: "number" },
              address: { type: "string" },
              delivery_date: { type: "string" },
              delivery_time: { type: "string" },
              comment: { type: "string" },
            },
            required: ["items", "total", "address"],
          },
        },
      },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("AI gateway error");
    }

    // We need to handle tool calls - read the full stream, check for tool calls, handle them
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let toolCalls: any[] = [];
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) fullContent += delta.content;
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.index !== undefined) {
                if (!toolCalls[tc.index]) toolCalls[tc.index] = { id: "", function: { name: "", arguments: "" } };
                if (tc.id) toolCalls[tc.index].id = tc.id;
                if (tc.function?.name) toolCalls[tc.index].function.name = tc.function.name;
                if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }
          }
        } catch {}
      }
    }

    // Handle tool calls (create_order)
    let orderCreated = false;
    for (const tc of toolCalls) {
      if (tc?.function?.name === "create_order") {
        try {
          const args = JSON.parse(tc.function.arguments);
          await supabase.from("orders").insert({
            customer_name: session?.customer_name || "Из чата",
            phone: session?.phone || "",
            address: args.address,
            items: args.items,
            total: args.total,
            delivery_date: args.delivery_date || null,
            delivery_time: args.delivery_time || null,
            comment: args.comment || "Заказ через чат-бота",
            status: "новый",
          });
          orderCreated = true;

          // If AI didn't produce text content, get a follow-up
          if (!fullContent) {
            const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3-flash-preview",
                messages: [
                  ...messages,
                  { role: "assistant", content: null, tool_calls: [{ id: tc.id, type: "function", function: { name: tc.function.name, arguments: tc.function.arguments } }] },
                  { role: "tool", tool_call_id: tc.id, content: JSON.stringify({ success: true, message: "Заказ создан успешно" }) },
                ],
              }),
            });
            if (followUp.ok) {
              const followUpData = await followUp.json();
              fullContent = followUpData.choices?.[0]?.message?.content || "✅ Заказ оформлен! Наш менеджер свяжется с вами для подтверждения.";
            } else {
              fullContent = "✅ Заказ оформлен! Наш менеджер свяжется с вами для подтверждения. 🌷";
            }
          }
        } catch (e) {
          console.error("Order creation error:", e);
          fullContent = "Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте ещё раз или позовите оператора.";
        }
      }
    }

    if (!fullContent) {
      fullContent = "Извините, произошла ошибка. Попробуйте ещё раз.";
    }

    // Save assistant message
    await supabase.from("chat_messages").insert({ session_id, role: "assistant", content: fullContent });

    // Update session updated_at
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", session_id);

    return new Response(JSON.stringify({ content: fullContent, order_created: orderCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-bot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
