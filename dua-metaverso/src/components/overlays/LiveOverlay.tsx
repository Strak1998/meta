"use client";
import { useEffect, useRef, useState } from "react";
import type { ConcertState } from "@/types/artist";

interface Props { concertState: ConcertState; }

export function LiveOverlay({ concertState }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlay = concertState.activeOverlay;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!overlay) { setVisible(false); return; }
    setVisible(true);
    if (overlay.expiresAt) {
      const remaining = overlay.expiresAt - Date.now();
      if (remaining > 0) timer.current = setTimeout(() => setVisible(false), remaining);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [overlay]);

  if (!visible || !overlay) return null;

  const data = overlay.data as Record<string, unknown>;
  const type = overlay.type;

  return (
    <>
      <style>{`
        @keyframes olFadeIn { from { opacity:0; transform:translate(-50%,20px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes artistIn { from { opacity:0; transform:scale(0.5); filter:blur(20px); } to { opacity:1; transform:scale(1); filter:blur(0); } }
        @keyframes countPulse { 0%{ transform:scale(1.4); opacity:0.4; } 100%{ transform:scale(1); opacity:1; } }
      `}</style>

      {type === "system_message" && (
        <div style={{ position:"absolute", bottom:"20%", left:"50%", transform:"translateX(-50%)", zIndex:50, textAlign:"center", maxWidth:"70vw", animation:"olFadeIn 0.4s ease" }}>
          <div style={{ background:"rgba(0,0,0,0.85)", border:"1px solid rgba(0,255,204,0.4)", borderRadius:16, padding:"20px 32px", backdropFilter:"blur(20px)" }}>
            <div style={{ fontSize:"clamp(16px,2.5vw,28px)", color:"#00ffcc", fontFamily:"Orbitron,sans-serif", fontWeight:700, letterSpacing:3 }}>
              {data.message as string}
            </div>
          </div>
        </div>
      )}

      {type === "artist_name" && (() => {
        const artist = concertState.artists.find(a => a.id === data.artistId);
        if (!artist) return null;
        return (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"clamp(11px,1.5vw,16px)", color:"#888", fontFamily:"Orbitron,sans-serif", letterSpacing:6, marginBottom:12 }}>A SEGUIR</div>
              <div style={{ fontSize:"clamp(40px,9vw,100px)", color:artist.accentColor, fontFamily:"Orbitron,sans-serif", fontWeight:900, letterSpacing:4, textShadow:`0 0 40px ${artist.accentColor}88`, animation:"artistIn 0.6s ease" }}>{artist.name}</div>
              {artist.bio && <div style={{ fontSize:"clamp(12px,1.8vw,20px)", color:"#888", marginTop:8, fontFamily:"Montserrat,sans-serif", letterSpacing:4 }}>{artist.bio}</div>}
            </div>
          </div>
        );
      })()}

      {type === "countdown" && <CountdownOverlay value={(data.countdown as number) ?? 5} onEnd={() => setVisible(false)} />}

      {type === "applause" && <ApplauseCanvas />}
    </>
  );
}

function CountdownOverlay({ value, onEnd }: { value: number; onEnd: () => void }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (n <= 0) { onEnd(); return; }
    const t = setTimeout(() => setN(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [n, onEnd]);
  return (
    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, background:"rgba(0,0,0,0.6)" }}>
      <div key={n} style={{ fontSize:"clamp(80px,22vw,240px)", color:"#00ffcc", fontFamily:"Orbitron,sans-serif", fontWeight:900, textShadow:"0 0 60px rgba(0,255,204,0.6)", animation:"countPulse 0.9s ease" }}>{n}</div>
    </div>
  );
}

function ApplauseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const colors = ["#00ffcc","#ff00ff","#ffd700","#ff6b35","#9b59b6"];
    const pts: Array<{ x:number; y:number; vx:number; vy:number; life:number; color:string; r:number }> = [];
    const spawn = () => { for (let i=0;i<8;i++) pts.push({ x:Math.random()*c.width, y:c.height+10, vx:(Math.random()-.5)*4, vy:-(Math.random()*6+4), life:1, color:colors[~~(Math.random()*colors.length)], r:Math.random()*8+4 }); };
    const si = setInterval(spawn, 50); spawn();
    let af: number;
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      for (let i=pts.length-1;i>=0;i--) { const p=pts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.012; if(p.life<=0){pts.splice(i,1);continue;} ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }
      ctx.globalAlpha=1; af=requestAnimationFrame(draw);
    };
    af=requestAnimationFrame(draw);
    return () => { clearInterval(si); cancelAnimationFrame(af); };
  }, []);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, zIndex:49, pointerEvents:"none" }} />;
}
