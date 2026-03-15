"use client";
import { useState, useEffect } from "react";
import type { ArtistSlot } from "@/types/artist";
import { defaultArtistSlots } from "@/lib/artist-registry";

const POSITIONS = ["esquerda","centro","direita"] as const;

export default function ArtistsPage() {
  const [slots, setSlots] = useState<ArtistSlot[]>(defaultArtistSlots);
  const [editId, setEditId] = useState<string|null>(null);
  const [draft, setDraft] = useState<Partial<ArtistSlot>>({});
  const [saved, setSaved] = useState(false);
  const [previewId, setPreviewId] = useState<string|null>(null);

  useEffect(() => {
    fetch("/api/backstage/events", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type:"PHASE_CHANGE",payload:{_query:true}}) }).catch(()=>{});
  }, []);

  const startEdit = (s: ArtistSlot) => { setEditId(s.id); setDraft({...s}); };
  const cancel = () => { setEditId(null); setDraft({}); };

  const save = async () => {
    if (!editId) return;
    setSlots(prev => prev.map(s => s.id===editId?{...s,...draft} as ArtistSlot:s));
    setEditId(null); setDraft({});
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  const test = async (s: ArtistSlot) => {
    setPreviewId(s.id);
    await fetch("/api/backstage/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"OVERLAY_SHOW",payload:{overlayType:"artist_name",artistId:s.id,duration:3000}})});
    setTimeout(()=>setPreviewId(null),3000);
  };

  const move = (i:number,d:-1|1) => {
    const next=[...slots];
    [next[i],next[i+d]]=[next[i+d],next[i]];
    setSlots(next);
  };

  const inp: React.CSSProperties = { width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"var(--radius-md)",padding:"10px 14px",color:"#fff",fontSize:13,outline:"none",fontFamily:"Montserrat,sans-serif",boxSizing:"border-box" };
  const lbl: React.CSSProperties = { display:"block",fontSize:9,color:"#555",letterSpacing:2,marginBottom:6 };

  return (
    <div style={{minHeight:"100vh",background:"#030305",color:"#e8e8e8",fontFamily:"Orbitron,sans-serif",padding:32}}>
      <div style={{maxWidth:860,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32}}>
          <div>
            <div style={{fontSize:9,color:"#555",letterSpacing:4,marginBottom:6}}>DUA BACKSTAGE</div>
            <div style={{fontSize:20,color:"#00ffcc",fontWeight:700,letterSpacing:2}}>GESTAO DE ARTISTAS</div>
          </div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            {saved&&<span style={{fontSize:11,color:"#00ff88",letterSpacing:2}}>GUARDADO</span>}
            <a href="/backstage" style={{padding:"10px 18px",background:"transparent",border:"1px solid rgba(0,255,204,0.3)",borderRadius:"var(--radius-md)",color:"#00ffcc",fontSize:11,letterSpacing:2,textDecoration:"none"}}>← BACKSTAGE</a>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {slots.map((s,i)=>(
            <div key={s.id} style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${s.name?s.accentColor+"33":"rgba(255,255,255,0.08)"}`,borderRadius:"var(--radius-md)",overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",background:editId===s.id?`${s.accentColor}0a`:"transparent"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <button onClick={()=>move(i,-1)} disabled={i===0} style={{background:"transparent",border:"1px solid #333",borderRadius:4,color:"#555",cursor:i===0?"default":"pointer",padding:"2px 6px",fontSize:10,opacity:i===0?0.2:1}}>▲</button>
                  <button onClick={()=>move(i,1)} disabled={i===slots.length-1} style={{background:"transparent",border:"1px solid #333",borderRadius:4,color:"#555",cursor:i===slots.length-1?"default":"pointer",padding:"2px 6px",fontSize:10,opacity:i===slots.length-1?0.2:1}}>▼</button>
                </div>
                <div style={{width:4,height:40,background:s.name?s.accentColor:"#333",borderRadius:2,flexShrink:0}}/>
                <div style={{fontSize:11,color:"#555",letterSpacing:2,width:28,flexShrink:0}}>{String(i+1).padStart(2,"0")}</div>
                <div style={{width:36,height:36,borderRadius:"50%",background:s.name?s.accentColor+"33":"rgba(255,255,255,0.05)",border:`2px solid ${s.name?s.accentColor+"66":"#333"}`,display:"flex",alignItems:"center",justifyContent:"center",color:s.name?s.accentColor:"#444",fontSize:16,flexShrink:0}}>{s.name?s.name.charAt(0):"?"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,color:s.name?"#fff":"#444",fontWeight:600,letterSpacing:1}}>{s.name||"SLOT VAZIO"}</div>
                  {s.bio&&<div style={{fontSize:11,color:"#666",marginTop:2,fontFamily:"Montserrat,sans-serif"}}>{s.bio}</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  {s.name&&previewId!==s.id&&<button onClick={()=>test(s)} style={{padding:"6px 12px",background:"transparent",border:`1px solid ${s.accentColor}44`,borderRadius:"var(--radius-md)",color:s.accentColor,fontSize:10,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:1}}>TEST</button>}
                  {previewId===s.id&&<div style={{fontSize:10,color:s.accentColor,letterSpacing:2}}>PREVIEW...</div>}
                  <button onClick={()=>editId===s.id?cancel():startEdit(s)} style={{padding:"6px 14px",background:editId===s.id?"rgba(255,68,102,0.1)":"transparent",border:`1px solid ${editId===s.id?"rgba(255,68,102,0.3)":"#333"}`,borderRadius:"var(--radius-md)",color:editId===s.id?"#ff4466":"#666",fontSize:10,fontFamily:"Orbitron,sans-serif",cursor:"pointer"}}>{editId===s.id?"CANCELAR":"EDITAR"}</button>
                </div>
              </div>

              {editId===s.id&&(
                <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{height:1,background:"rgba(255,255,255,0.05)"}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div><label style={lbl}>NOME</label><input autoFocus value={draft.name??""} onChange={e=>setDraft(d=>({...d,name:e.target.value}))} style={inp}/></div>
                    <div><label style={lbl}>BIO / GENERO</label><input value={draft.bio??""} onChange={e=>setDraft(d=>({...d,bio:e.target.value}))} style={inp}/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                    <div><label style={lbl}>COR DE ACENTO</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={draft.accentColor??"#00ffcc"} onChange={e=>setDraft(d=>({...d,accentColor:e.target.value}))} style={{width:40,height:34,border:"none",background:"none",cursor:"pointer"}}/><input value={draft.accentColor??""} onChange={e=>setDraft(d=>({...d,accentColor:e.target.value}))} style={{...inp,flex:1,fontFamily:"monospace"}}/></div></div>
                    <div><label style={lbl}>COR DE PELE</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={draft.skinColor??"#8B4513"} onChange={e=>setDraft(d=>({...d,skinColor:e.target.value}))} style={{width:40,height:34,border:"none",background:"none",cursor:"pointer"}}/><input value={draft.skinColor??""} onChange={e=>setDraft(d=>({...d,skinColor:e.target.value}))} style={{...inp,flex:1,fontFamily:"monospace"}}/></div></div>
                    <div><label style={lbl}>COR DE ROUPA</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={draft.clothingColor??"#ff6b35"} onChange={e=>setDraft(d=>({...d,clothingColor:e.target.value}))} style={{width:40,height:34,border:"none",background:"none",cursor:"pointer"}}/><input value={draft.clothingColor??""} onChange={e=>setDraft(d=>({...d,clothingColor:e.target.value}))} style={{...inp,flex:1,fontFamily:"monospace"}}/></div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div>
                      <label style={lbl}>POSICAO PADRAO</label>
                      <div style={{display:"flex",gap:6}}>
                        {POSITIONS.map(p=><button key={p} onClick={()=>setDraft(d=>({...d,defaultPosition:p}))} style={{flex:1,padding:"8px 0",background:draft.defaultPosition===p?(draft.accentColor??"#00ffcc")+"22":"transparent",border:`1px solid ${draft.defaultPosition===p?(draft.accentColor??"#00ffcc"):"#333"}`,borderRadius:"var(--radius-md)",color:draft.defaultPosition===p?(draft.accentColor??"#00ffcc"):"#555",fontSize:9,fontFamily:"Orbitron,sans-serif",cursor:"pointer"}}>{p==="esquerda"?"ESQ":p==="centro"?"CTR":"DIR"}</button>)}
                      </div>
                    </div>
                    <div><label style={lbl}>MUSICA DE ENTRADA (URL)</label><input type="url" value={draft.entryMusicUrl??""} onChange={e=>setDraft(d=>({...d,entryMusicUrl:e.target.value||undefined}))} placeholder="https://..." style={inp}/></div>
                  </div>
                  <div style={{display:"flex",gap:10}}>
                    <button onClick={save} style={{flex:1,padding:13,background:draft.accentColor??"#00ffcc",color:"#030305",border:"none",borderRadius:"var(--radius-md)",fontSize:12,fontWeight:700,fontFamily:"Orbitron,sans-serif",cursor:"pointer",letterSpacing:2}}>GUARDAR</button>
                    <button onClick={cancel} style={{padding:"13px 24px",background:"transparent",border:"1px solid #333",borderRadius:"var(--radius-md)",color:"#666",fontSize:12,fontFamily:"Orbitron,sans-serif",cursor:"pointer"}}>CANCELAR</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
