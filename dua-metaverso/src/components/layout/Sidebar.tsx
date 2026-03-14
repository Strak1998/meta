"use client";

import { MessageSquare, Users as UsersIcon, Send, Settings2, ListMusic, Mic } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

interface SidebarProps {
  messages: any[];
  viewers: number;
  connected: boolean;
  sendMessage: (msg: string) => void;
  sendReaction: (r: string) => void;
}

export default function Sidebar({
  messages,
  viewers,
  connected,
  sendMessage,
  sendReaction,
}: SidebarProps) {
  const [inputMsg, setInputMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "queue">("chat");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    sendMessage(inputMsg);
    setInputMsg("");
  };

  return (
    <aside className="w-80 h-screen border-l border-cyan-400/10 glassmorphism-strong flex flex-col flex-shrink-0 z-20 hidden md:flex">
      {/* ── Tabs header ── */}
      <div className="flex p-4 border-b border-cyan-400/10 gap-2">
        <button 
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase transition-colors rounded ${activeTab === "chat" ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:bg-white/5"}`}
        >
          <MessageSquare className="w-4 h-4 mx-auto mb-1" /> Chat
        </button>
        <button 
          onClick={() => setActiveTab("queue")}
          className={`flex-1 py-1.5 text-xs font-bold tracking-widest uppercase transition-colors rounded ${activeTab === "queue" ? "bg-purple-500/20 text-purple-400" : "text-white/40 hover:bg-white/5"}`}
        >
          <ListMusic className="w-4 h-4 mx-auto mb-1" /> Fila
        </button>
      </div>

      {activeTab === "chat" ? (
        <>
          <div className="p-4 border-b border-cyan-400/10 flex items-center justify-between text-xs text-cyan-400/70">
            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {viewers} na sala</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/40">Modo DJ</span>
              <Switch className="data-[state=checked]:bg-cyan-400" />
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className={`font-bold text-cyan-300 mr-2`}>{msg.user}:</span>
                  <span className="text-white/80">{msg.text}</span>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30 pt-10">
                  <MessageSquare className="w-8 h-8 mx-auto" />
                  <p className="text-xs">O chat está silencioso.<br/>Sê o primeiro a falar.</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-cyan-400/10 space-y-3 bg-black/40">
            <div className="flex gap-2 justify-center">
              {["👏", "🔥", "🚀", "🎸"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-cyan-400/20 border border-white/10 transition flex items-center justify-center text-base"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Envia uma mensagem..."
                className="bg-black/50 border-cyan-400/20 text-sm h-10 text-white placeholder:text-white/20 focus-visible:ring-cyan-400/50"
              />
              <Button type="submit" size="icon" className="h-10 w-10 bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_10px_rgba(0,255,204,0.3)]">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
            <p className="text-[10px] uppercase tracking-widest text-purple-400/70 mb-1">A tocar agora</p>
            <p className="font-bold text-white mb-2">DUA - Rap Cósmico IA</p>
            <div className="flex items-center justify-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-xs text-purple-300 font-mono">128 BPM</span>
            </div>
          </div>
          
          <p className="text-xs text-white/40 uppercase tracking-widest mt-4">PRÓXIMAS NA FILA</p>
          <div className="space-y-2">
             <div className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center">
               <div>
                  <p className="text-sm font-medium text-white/90">Crioulo Drill 2026</p>
                  <p className="text-[10px] text-cyan-400">Pedida por: Carlos</p>
               </div>
               <span className="text-xs text-white/30">2:14</span>
             </div>
             <div className="p-3 rounded bg-white/5 border border-white/10 flex justify-between items-center opacity-50">
               <div>
                  <p className="text-sm font-medium text-white/90">Kizomba Espacial</p>
                  <p className="text-[10px] text-cyan-400">Pedida por: Maria</p>
               </div>
               <span className="text-xs text-white/30">3:30</span>
             </div>
          </div>
        </div>
      )}
    </aside>
  );
}
