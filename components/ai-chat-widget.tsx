"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, RefreshCw, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: SimpleMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideText) setInput("");
    setIsLoading(true);

    try {
      // Kita panggil titik akhir /api/chat buatan kita
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.body) throw new Error("Respons streaming kosong");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Tambahkan pesan penampung (*placeholder*) asisten
      const assistantMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        // Mutakhirkan teks secara real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: assistantContent } : msg
          )
        );
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Mohon maaf, terjadi gangguan saat menghubungi peladen Advisory AI.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadSession = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[480px] mb-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          {/* Header Widget */}
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1">
                  Koperasi-AI <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                </h3>
                <p className="text-[9px] text-slate-400">Penasihat SOP & Pembukuan Ganda</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={reloadSession}
                  title="Muat Ulang Sesi"
                  className="w-6 h-6 text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Area Pesan */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/30">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Sparkles className="w-8 h-8 text-blue-500/40 mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-700">Ada yang bisa saya bantu hari ini?</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Tanyakan mengenai aturan batas saldo, tata cara pembukuan jurnal ganda, atau prosedur pencatatan transaksi kasir.
                </p>
                <div className="mt-4 space-y-1 w-full text-left">
                  <p className="text-[9px] font-bold text-slate-400 uppercase px-1">Pertanyaan Umum:</p>
                  <button
                    onClick={() => sendMessage("Bagaimana SOP pencatatan setoran simpanan tunai?")}
                    className="w-full text-left text-[10px] bg-white p-1.5 rounded border border-slate-100 hover:border-blue-200 text-slate-600 truncate block"
                  >
                    💡 Bagaimana SOP pencatatan setoran simpanan?
                  </button>
                  <button
                    onClick={() => sendMessage("Berapa sanksi/denda keterlambatan angsuran?")}
                    className="w-full text-left text-[10px] bg-white p-1.5 rounded border border-slate-100 hover:border-blue-200 text-slate-600 truncate block"
                  >
                    💡 Berapa denda keterlambatan angsuran?
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm whitespace-pre-wrap"
                    }`}
                  >
                    {m.content || <span className="animate-pulse">...</span>}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-0.5 px-1">
                    {m.role === "user" ? "Anda" : "Koperasi-AI"}
                  </span>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-75" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-150" />
                <span className="text-[9px]">Menyusun panduan...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Area Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5"
          >
            <input
              type="text"
              placeholder="Tanyakan SOP atau panduan pembukuan..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-8 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-900 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* ── Tombol Pemicu Mengambang ── */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl flex items-center gap-2 group transition-all duration-300 hover:scale-105"
      >
        <MessageSquare className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold">Koperasi-AI</span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </Button>
    </div>
  );
}
