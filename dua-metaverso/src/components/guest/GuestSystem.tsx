"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";

export default function GuestSystem({
  onJoin,
}: {
  onJoin: (username: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("");

  const join = () => {
    const username = name.trim() || `Lunar_${Math.floor(Math.random() * 9999)}`;
    onJoin(username);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="glassmorphism-strong border-white/8 text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-lg tracking-wide">
            <User className="h-5 w-5 text-cyan-400" />
            Entrar no Concerto
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-white/35 leading-relaxed">
            Escolhe o teu nome para entrar no metaverso lunar.
          </p>
          <Input
            className="border-white/8 bg-white/4 text-white placeholder-white/20"
            placeholder="O teu nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            autoFocus
          />
          <Button
            className="w-full font-heading text-sm font-bold tracking-wider"
            style={{
              background: "linear-gradient(135deg, #00ccaa, #00ffcc, #a855f6, #ff00ff)",
            }}
            onClick={join}
          >
            ENTRAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
