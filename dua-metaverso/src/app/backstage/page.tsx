"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { ArtistSlot, StagePosition, ConcertState, OverlayType } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

const PHASES = [
  { id:"opening", label:"ABERTURA", color:"#00ffcc" },
  { id:"dua2_presentation", label:"DUA 2.0", color:"#ff00ff" },
  { id:"vado_performance", label:"VADO MKA", color:"#ff6b35" },
  { id:"uzzy_performance", label:"UZZY", color:"#9b59b6" },
  { id:"estraca_performance", label:"ESTRACA", color:"#00d4ff" },
  { id:"finale", label:"FINALE", color:"#ffd700" },
];

type Tab = "maestro"|"artistas"|"audio"|"chat"|"dua"|"emergencia";

const S: React.CSSProperties = { fontFamily:"Orbitron,sans-serif" };

function fmt(ms: number) {
  const s=Math.floor(ms/1000); return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

async function cmd(type: string, payload: Record<string,unknown>={}) {
  if (type === "CHAT_BROADCAST" && payload.text) {
    await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user:"DUA Bot",text:payload.text}) });
    return;
  }
  await fetch("/api/backstage/events", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type,payload}) });
}

export default function Backstage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("maestro");
  const [state, setState] = useState<ConcertState>({ phase:"opening", artists:defaultArtistSlots(), audioMode:"silence", isPaused:false, phaseStartedAt:Date.now(), commandLog:[] });
  const [connected, setConnected] = useState(false);
  const [analytics, setAnalytics] = useState({ activeViewers:0, viewerPeak:0, messagesTotal:0, ctaClicks:0, conversionRate:"0.0", phaseElapsedMs:0 });
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [confirm, setConfirm] = useState<string|null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState("");
  const [overlayDur, setOverlayDur] = useState(5);
  const [countdown, setCountdown] = useState(5);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Array<{id:string;user:string;text:string;timestamp:number}>>([]);
  const audioRef = useRef<HTMLAudioElement|null>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const animRef = useRef<number|null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource("/api/backstage/events");
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e: MessageEvent) => {
      try {
        const c = JSON.parse(e.data as string);
        if (c.type==="PHASE_CHANGE"&&c.payload?.init) { setState(c.payload.state as ConcertState); return; }
        setState(prev => {
          const p=c.payload??{};
          switch(c.type){
            case "PHASE_CHANGE": return {...prev,phase:p.phase as string,phaseStartedAt:Date.now()};
            case "ARTIST_ENTER": return {...prev,artists:prev.artists.map((a:ArtistSlot)=>a.id===p.artistId?{...a,status:"em_palco" as const}:a)};
            case "ARTIST_EXIT": return {...prev,artists:prev.artists.map((a:ArtistSlot)=>a.id===p.artistId?{...a,status:"saiu" as const}:a)};
            case "EMERGENCY_PAUSE": return {...prev,isPaused:true};
            case "EMERGENCY_RESUME": return {...prev,isPaused:false};
            case "OVERLAY_SHOW": return {...prev,activeOverlay:{type:p.overlayType as OverlayType,data:p,expiresAt:p.duration?Date.now()+(p.duration as number):undefined}};
            case "OVERLAY_HIDE": return {...prev,activeOverlay:undefined};
            default: return prev;
          }
        });
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/chat");
    es.onmessage = (e: MessageEvent) => {
      try {
        const d=JSON.parse(e.data as string);
        if(d.type==="init") setMessages(d.messages??[]);
        else if(d.type==="message") setMessages(prev=>[...prev.slice(-199),{id:d.id,user:d.user,text:d.text,timestamp:d.timestamp}]);
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  useEffect(() => {
    const i=setInterval(async()=>{try{const r=await fetch("/api/backstage/analytics");if(r.ok)setAnalytics(await r.json());}catch{}},5000);
    return ()=>clearInterval(i);
  }, []);

  useEffect(() => {
    const i=setInterval(()=>setPhaseElapsed(Date.now()-state.phaseStartedAt),1000);
    return ()=>clearInterval(i);
  }, [state.phaseStartedAt]);

  useEffect(() => {
    const h=(e:KeyboardEvent)=>{if(e.key.toLowerCase()==="m"&&(e.target as HTMLElement).tagName!=="INPUT")handleMute();};
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  });

  const handlePhase = useCallback(async(phase:string)=>{
    if(confirm===phase){ await cmd("PHASE_CHANGE",{phase}); setConfirm(null); }
    else { setConfirm(phase); setTimeout(()=>setConfirm(null),3000); }
  },[confirm]);

  const handleEnter = useCallback(async(a:ArtistSlot,pos:StagePosition)=>{
    await cmd("OVERLAY_SHOW",{overlayType:"artist_name",artistId:a.id,duration:3000});
    setTimeout(()=>cmd("ARTIST_ENTER",{artistId:a.id,position:pos}),2800);
  },[]);

  const handleMute = () => {
    setMuted(m=>{ if(audioRef.current) audioRef.current.volume=m?1:0; return !m; });
  };

  const startStream = async(url:string)=>{
    try {
      const ctx=new AudioContext();
      const audio=new Audio(url); audio.crossOrigin="anonymous"; audioRef.current=audio;
      const src=ctx.createMediaElementSource(audio);
      const an=ctx.createAnalyser(); an.fftSize=256;
      src.connect(an); an.connect(ctx.destination); analyserRef.current=an;
      audio.volume=muted?0:1; await audio.play();
      const data=new Uint8Array(an.frequencyBinCount);
      const tick=()=>{ an.getByteFrequencyData(data); setAudioLevel(Math.min(100,Math.round(data.reduce((a:number,b:number)=>a+b,0)/data.length/255*200))); animRef.current=requestAnimationFrame(tick); };
      animRef.current=requestAnimationFrame(tick);
      await cmd("AUDIO_SOURCE",{mode:"stream",url});
    } catch(err){ console.error(err); }
  };

  const stopStream = async()=>{
    if(animRef.current) cancelAnimationFrame(animRef.current);
    if(audioRef.current){ audioRef.current.pause(); audioRef.current=null; }
    analyserRef.current=null; setAudioLevel(0);
    await cmd("AUDIO_SOURCE",{mode:"silence"});
  };

  const phase=PHASES.find(p=>p.id===state.phase);

  const headerStyle: React.CSSProperties = { background:"rgba(0,0,0,0.92)", borderBottom:"1px solid rgba(0,255,204,0.2)", padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, gap:12 };
  const tagStyle=(ok:boolean): React.CSSProperties => ({ fontSize:9, letterSpacing:2, padding:"3px 8px", borderRadius:4, background:ok?"rgba(0,255,100,0.15)":"rgba(255,68,102,0.15)", color:ok?"#00ff88":"#ff4466", border:`1px solid ${ok?"rgba(0,255,100,0.3)":"rgba(255,68,102,0.3)"}` });
  const tabStyle=(active:boolean): React.CSSProperties => ({ padding:"13px 18px", background:"transparent", border:"none", borderBottom:active?"2px solid #00ffcc":"2px solid transparent", color:active?"#00ffcc":"#555", fontSize:10, letterSpacing:2, cursor:"pointer", fontFamily:"Orbitron,sans-serif" });
  const bigBtn=(color:string,bg:string): React.CSSProperties => ({ padding:"16px 20px", background:bg, border:`2px solid ${color}`, borderRadius:10, color, fontSize:13, fontWeight:700, fontFamily:"Orbitron,sans-serif", letterSpacing:2, cursor:"pointer", width:"100%", textAlign:"left" });
  const inp: React.CSSProperties = { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"10px 14px", color:"#fff", fontSize:13, outline:"none", fontFamily:"Montserrat,sans-serif", boxSizing:"border-box" };
  const lbl: React.CSSProperties = { display:"block", fontSize:9, color:"#555", letterSpacing:2, marginBottom:6 };

  return (
    <div style={{minHeight:"100vh",background:"#030305",color:"#e8e8e8",...S,display:"flex",flexDirection:"column"}}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:11,color:"#00ffcc",letterSpacing:4}}>DUA</span>
          <span style={{width:1,height:18,background:"#333"}}/>
          <span style={{fontSize:11,letterSpacing:3,color:"#888"}}>BACKSTAGE</span>
          <span style={tagStyle(connected)}>{connected?"ONLINE":"OFFLINE"}</span>
          {state.isPaused&&<span style={tagStyle(false)}>PAUSADO</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:20}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555",letterSpacing:2}}>FASE</div><div style={{fontSize:12,color:phase?.color??"#00ffcc",fontWeight:700}}>{phase?.label??state.phase.toUpperCase()}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555",letterSpacing:2}}>DURACAO</div><div style={{fontSize:12,color:"#888",fontFamily:"monospace"}}>{fmt(phaseElapsed)}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555",letterSpacing:2}}>ESPECT.</div><div style={{fontSize:12,color:"#00ffcc",fontWeight:700}}>{analytics.activeViewers}</div></div>
          <a href="/" target="_blank" style={{padding:"8px 14px",background:"rgba(0,255,204,0.1)",border:"1px solid rgba(0,255,204,0.3)",borderRadius:8,color:"#00ffcc",fontSize:10,textDecoration:"none",letterSpacing:2}}>VER CONCERTO</a>
          <a href="/backstage/artists" style={{padding:"8px 14px",background:"transparent",border:"1px solid #333",borderRadius:8,color:"#666",fontSize:10,textDecoration:"none",letterSpacing:2}}>ARTISTAS</a>
          <button onClick={async()=>{await fetch("/api/backstage/auth",{method:"DELETE"});router.push("/backstage/login");}} style={{padding:"8px 14px",background:"transparent",border:"1px solid #333",borderRadius:8,color:"#555",fontSize:10,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:2}}>SAIR</button>
        </div>
      </div>

      {/* METRICS BAR */}
      <div style={{background:"rgba(0,0,0,0.5)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"7px 20px",display:"flex",gap:28}}>
        {[["PICO",analytics.viewerPeak],["MSGS",analytics.messagesTotal],["CTA",analytics.ctaClicks],["CONV",`${analytics.conversionRate}%`]].map(([k,v])=>(
          <div key={k as string} style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:9,color:"#555",letterSpacing:2}}>{k}</span>
            <span style={{fontSize:12,color:"#888",fontFamily:"monospace"}}>{v}</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(0,0,0,0.4)",padding:"0 20px"}}>
        {(["maestro","artistas","audio","chat","dua","emergencia"] as Tab[]).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={tabStyle(tab===t)}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* PANELS */}
      <div style={{flex:1,padding:24,overflow:"auto"}}>

        {/* MAESTRO */}
        {tab==="maestro"&&(
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
            <div>
              <div style={{fontSize:10,color:"#555",letterSpacing:3,marginBottom:16}}>CONTROLO DE FASES</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                {PHASES.map(p=>{
                  const active=state.phase===p.id; const conf=confirm===p.id;
                  return <button key={p.id} onClick={()=>handlePhase(p.id)} style={{padding:"20px 16px",background:active?`${p.color}22`:conf?`${p.color}15`:"rgba(0,0,0,0.4)",border:`2px solid ${active?p.color:conf?p.color+"88":"#222"}`,borderRadius:12,color:active?p.color:conf?p.color+"cc":"#555",fontSize:conf?10:13,fontWeight:700,fontFamily:"Orbitron,sans-serif",letterSpacing:2,cursor:active?"default":"pointer",boxShadow:active?`0 0 20px ${p.color}22`:undefined}}>
                    {conf?`CONFIRMAR? ${p.label}`:active?`► ${p.label}`:p.label}
                  </button>;
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
              <button onClick={()=>cmd("CONFETTI",{intensity:"high",colors:["#00ffcc","#ff00ff","#ffd700"]})} style={bigBtn("#aaa","rgba(0,0,0,0.4)")}>CONFETTI</button>
              <button onClick={()=>cmd("CTA_TRIGGER",{variant:"default"})} style={bigBtn("#ff00ff","rgba(255,0,255,0.08)")}>LANCAR CTA</button>
              <button onClick={()=>cmd("OVERLAY_SHOW",{overlayType:"applause",duration:3000})} style={bigBtn("#ffd700","rgba(255,215,0,0.08)")}>APLAUSOS</button>
            </div>
          </div>
        )}

        {/* ARTISTAS */}
        {tab==="artistas"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{fontSize:10,color:"#555",letterSpacing:3}}>SLOTS DE ARTISTAS</div>
              <a href="/backstage/artists" style={{fontSize:10,color:"#00ffcc",letterSpacing:2,textDecoration:"none"}}>GESTAO COMPLETA →</a>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
              {state.artists.map((a:ArtistSlot)=>{
                const on=a.status==="em_palco";
                return <div key={a.id} style={{border:`1px solid ${a.name?a.accentColor+"44":"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:18,background:on?`${a.accentColor}0a`:"rgba(0,0,0,0.4)",position:"relative"}}>
                  {on&&<div style={{position:"absolute",top:-1,left:0,right:0,height:2,background:a.accentColor,borderRadius:"12px 12px 0 0",boxShadow:`0 0 12px ${a.accentColor}`}}/>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div>
                      <div style={{fontSize:9,color:{aguarda:"#888",pronto:"#f39c12",em_palco:"#00ffcc",saiu:"#444"}[a.status],letterSpacing:2,marginBottom:4}}>{a.status.toUpperCase()}</div>
                      <div style={{fontSize:14,color:a.name?a.accentColor:"#444",fontWeight:700}}>{a.name||"SLOT VAZIO"}</div>
                      {a.bio&&<div style={{fontSize:11,color:"#666",marginTop:2}}>{a.bio}</div>}
                    </div>
                    <div style={{width:36,height:36,borderRadius:"50%",background:a.accentColor+"33",border:`2px solid ${a.accentColor}66`,display:"flex",alignItems:"center",justifyContent:"center",color:a.accentColor,fontSize:16}}>{a.name?a.name.charAt(0):"?"}</div>
                  </div>
                  {a.name&&!on&&a.status!=="saiu"&&(
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>cmd("OVERLAY_SHOW",{overlayType:"artist_name",artistId:a.id,duration:3000})} style={{flex:1,padding:"8px 0",background:`${a.accentColor}22`,border:`1px solid ${a.accentColor}44`,borderRadius:8,color:a.accentColor,fontSize:10,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:1}}>REVEAL</button>
                      <button onClick={()=>handleEnter(a,a.defaultPosition)} style={{flex:2,padding:"8px 0",background:a.accentColor,border:"none",borderRadius:8,color:"#030305",fontSize:11,fontWeight:700,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:1}}>ENTRADA</button>
                    </div>
                  )}
                  {on&&(
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>cmd("ARTIST_EXIT",{artistId:a.id})} style={{flex:2,padding:"8px 0",background:"rgba(255,68,102,0.2)",border:"1px solid rgba(255,68,102,0.5)",borderRadius:8,color:"#ff4466",fontSize:11,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:1}}>SAIDA</button>
                      <button onClick={()=>cmd("SPOTLIGHT",{artistId:a.id})} style={{flex:1,padding:"8px 0",background:"rgba(255,215,0,0.15)",border:"1px solid rgba(255,215,0,0.4)",borderRadius:8,color:"#ffd700",fontSize:16,cursor:"pointer"}}>★</button>
                    </div>
                  )}
                </div>;
              })}
            </div>
          </div>
        )}

        {/* AUDIO */}
        {tab==="audio"&&(
          <div style={{maxWidth:600}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:3,marginBottom:20}}>CONTROLO DE AUDIO</div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>URL DO STREAM (Icecast / HLS / MP3)</label>
              <div style={{display:"flex",gap:8}}>
                <input type="url" placeholder="http://localhost:8000/stream.mp3" value={streamUrl} onChange={e=>setStreamUrl(e.target.value)} style={{...inp,flex:1}} />
                <button onClick={()=>startStream(streamUrl)} disabled={!streamUrl} style={{padding:"0 16px",background:"#00ffcc",color:"#030305",border:"none",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>LIGAR</button>
                <button onClick={stopStream} style={{padding:"0 12px",background:"transparent",border:"1px solid #333",borderRadius:8,color:"#666",fontSize:11,fontFamily:"Orbitron,sans-serif",cursor:"pointer"}}>STOP</button>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl}>NIVEL DE AUDIO</label>
              <div style={{height:24,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${audioLevel}%`,background:audioLevel>80?"#ff4466":audioLevel>60?"#ffd700":"#00ffcc",transition:"width 0.05s,background 0.2s",borderRadius:4}}/>
                <div style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"#888",fontFamily:"monospace"}}>{audioLevel}%</div>
              </div>
            </div>
            <button onClick={handleMute} style={{width:"100%",padding:14,background:muted?"rgba(255,68,102,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${muted?"rgba(255,68,102,0.5)":"#333"}`,borderRadius:8,color:muted?"#ff4466":"#888",fontSize:12,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:1}}>
              {muted?"MUTE ACTIVO — M PARA DESMUTAR":"MUTE (tecla M)"}
            </button>
            <div style={{marginTop:24,background:"rgba(0,0,0,0.3)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:20}}>
              <div style={{fontSize:10,color:"#555",letterSpacing:3,marginBottom:12}}>INSTRUCOES</div>
              {[
                {t:"ABLETON → ICECAST",d:"Instala Icecast2. Plugin Liquidsoap. URL: http://localhost:8000/live.mp3"},
                {t:"MESA FISICA → USB",d:"Liga via interface USB (Focusrite Scarlett). Usa modo MICROFONE no browser."},
                {t:"MIXLR / SOUNDCLOUD",d:"Inicia stream. Copia URL publico e cola acima."},
                {t:"MIXXX → ICECAST",d:"Settings > Broadcast > Icecast2. Port 8000, mount /stream."},
              ].map(({t,d})=>(
                <div key={t} style={{borderLeft:"2px solid rgba(0,255,204,0.2)",paddingLeft:12,marginBottom:14}}>
                  <div style={{fontSize:10,color:"#00ffcc",letterSpacing:1,marginBottom:4}}>{t}</div>
                  <div style={{fontSize:12,color:"#666",lineHeight:1.6,fontFamily:"Montserrat,sans-serif"}}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT */}
        {tab==="chat"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20,height:"calc(100vh - 220px)"}}>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:10,color:"#555",letterSpacing:3}}>FEED DE MENSAGENS</div>
              <div style={{flex:1,background:"rgba(0,0,0,0.4)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)",overflow:"auto",padding:14,display:"flex",flexDirection:"column",gap:8}}>
                {messages.map((m)=>(
                  <div key={m.id} style={{padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.02)",display:"flex",gap:10}}>
                    <div style={{flex:1}}>
                      <span style={{fontSize:11,color:"#00ffcc",fontWeight:600}}>{m.user}</span>
                      <span style={{fontSize:11,color:"#888",marginLeft:8,fontFamily:"monospace"}}>{new Date(m.timestamp).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})}</span>
                      <div style={{fontSize:13,color:"#ccc",marginTop:2,fontFamily:"Montserrat,sans-serif"}}>{m.text}</div>
                    </div>
                    <button onClick={()=>cmd("CHAT_HIGHLIGHT",{messageId:m.id})} style={{background:"transparent",border:"1px solid #333",borderRadius:6,color:"#555",cursor:"pointer",padding:"4px 8px",fontSize:12}}>★</button>
                  </div>
                ))}
                <div ref={chatEndRef}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <input placeholder="Mensagem como DUA Bot..." value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&cmd("CHAT_BROADCAST",{text:chatInput}).then(()=>setChatInput(""))} style={{...inp,flex:1}} />
                <button onClick={()=>cmd("CHAT_BROADCAST",{text:chatInput}).then(()=>setChatInput(""))} disabled={!chatInput.trim()} style={{padding:"0 18px",background:"#00ffcc",color:"#030305",border:"none",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontSize:11,fontWeight:700,cursor:"pointer"}}>ENVIAR</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{fontSize:10,color:"#555",letterSpacing:3}}>ACOES RAPIDAS</div>
              {["Intervalo de 5 minutos. Ja voltamos!","Obrigado por estarem aqui. Este momento e especial.","A seguir: VADO MKA no palco!"].map(t=>(
                <button key={t} onClick={()=>cmd("CHAT_BROADCAST",{text:t})} style={{padding:"12px 16px",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#aaa",fontSize:12,fontFamily:"Orbitron,sans-serif",cursor:"pointer",textAlign:"left",letterSpacing:1}}>{t}</button>
              ))}
            </div>
          </div>
        )}

        {/* DUA 2.0 */}
        {tab==="dua"&&(
          <div style={{maxWidth:580}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:3,marginBottom:20}}>CONTROLO DUA 2.0</div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={()=>cmd("CTA_TRIGGER",{variant:"default"})} style={bigBtn("#ff00ff","rgba(255,0,255,0.08)")}>LANCAR MODAL DUA 2.0 — TODOS OS ESPECTADORES</button>
              <button onClick={()=>cmd("CTA_TRIGGER",{variant:"urgency"})} style={bigBtn("#ffd700","rgba(255,215,0,0.08)")}>MODAL COM URGENCIA (oferta limitada)</button>
              <button onClick={()=>cmd("OVERLAY_SHOW",{overlayType:"system_message",message:"Experimenta DUA 2.0 agora — dua.2lados.pt",duration:8000})} style={bigBtn("#aaa","rgba(0,0,0,0.4)")}>MOSTRAR LINK DUA 2.0 NO ECRA</button>
              <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16}}>
                <label style={lbl}>MENSAGEM PERSONALIZADA NO ECRA</label>
                <input placeholder="Texto..." value={overlayMsg} onChange={e=>setOverlayMsg(e.target.value)} style={{...inp,marginBottom:10}} />
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><label style={lbl}>DURACAO (seg)</label><input type="number" min={2} max={30} value={overlayDur} onChange={e=>setOverlayDur(Number(e.target.value))} style={{...inp,width:"100%"}} /></div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>cmd("OVERLAY_SHOW",{overlayType:"system_message",message:overlayMsg,duration:overlayDur*1000})} disabled={!overlayMsg} style={{flex:1,padding:12,background:"#00ffcc",color:"#030305",border:"none",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>MOSTRAR NO ECRA</button>
                  <button onClick={()=>cmd("OVERLAY_HIDE")} style={{padding:"12px 18px",background:"transparent",border:"1px solid #333",borderRadius:8,color:"#666",fontFamily:"Orbitron,sans-serif",fontSize:12,cursor:"pointer"}}>LIMPAR</button>
                </div>
              </div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:16}}>
                <label style={lbl}>CONTAGEM DECRESCENTE</label>
                <div style={{display:"flex",gap:8}}>
                  <input type="number" min={3} max={60} value={countdown} onChange={e=>setCountdown(Number(e.target.value))} style={{...inp,width:80}} />
                  <button onClick={()=>cmd("OVERLAY_SHOW",{overlayType:"countdown",countdown,duration:countdown*1000+500})} style={{flex:1,padding:"0 16px",background:"#9b59b6",color:"#fff",border:"none",borderRadius:8,fontFamily:"Orbitron,sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",letterSpacing:1}}>INICIAR</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCIA */}
        {tab==="emergencia"&&(
          <div style={{maxWidth:520}}>
            <div style={{fontSize:10,color:"#ff4466",letterSpacing:3,marginBottom:20}}>PAINEL DE EMERGENCIA</div>
            <div style={{background:"rgba(255,68,102,0.05)",border:"1px solid rgba(255,68,102,0.2)",borderRadius:12,padding:24,marginBottom:20}}>
              <div style={{fontSize:11,color:"#ff4466",letterSpacing:2,marginBottom:16}}>ACOES DE ALTO IMPACTO — AFECTAM TODOS OS ESPECTADORES</div>
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <button onClick={()=>cmd("EMERGENCY_PAUSE")} style={{padding:18,background:"rgba(255,68,102,0.2)",border:"2px solid rgba(255,68,102,0.6)",borderRadius:8,color:"#ff4466",fontSize:14,fontWeight:700,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:3}}>PAUSAR TUDO</button>
                <button onClick={()=>cmd("EMERGENCY_RESUME")} style={{padding:18,background:"rgba(0,255,100,0.1)",border:"2px solid rgba(0,255,100,0.4)",borderRadius:8,color:"#00ff88",fontSize:14,fontWeight:700,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:3}}>RETOMAR</button>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {label:"MUSICA DE INTERVALO",action:()=>cmd("OVERLAY_SHOW",{overlayType:"system_message",message:"Intervalo — voltamos ja!",duration:120000})},
                {label:"AGUARDA — TECNICO",action:()=>cmd("OVERLAY_SHOW",{overlayType:"system_message",message:"A resolver problema tecnico. Aguarda...",duration:60000})},
                {label:"LIMPAR OVERLAYS",action:()=>cmd("OVERLAY_HIDE")},
                {label:"ENCERRAR CONCERTO",action:()=>{cmd("PHASE_CHANGE",{phase:"finale"});cmd("OVERLAY_SHOW",{overlayType:"system_message",message:"Obrigado por fazerem parte desta noite!",duration:30000});}},
              ].map(({label,action})=>(
                <button key={label} onClick={action} style={{padding:"14px 18px",background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#aaa",fontSize:12,fontFamily:"Orbitron,sans-serif",cursor:"pointer",textAlign:"left",letterSpacing:2}}>{label}</button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
