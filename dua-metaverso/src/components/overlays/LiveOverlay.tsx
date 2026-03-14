"use client";

import type { ConcertState } from "@/types/artist";

export function LiveOverlay({ concertState }: { concertState: ConcertState }) {
  const activeArtists = concertState.artists.filter((a) => a.status === "em_palco");
  if (activeArtists.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
      {activeArtists.map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded-full border px-3 py-1"
          style={{ borderColor: a.accentColor + "40", backgroundColor: a.accentColor + "10" }}>
          <span className="h-1.5 w-1.5 animate-ping rounded-full" style={{ backgroundColor: a.accentColor }} />
          <span className="font-heading text-[10px] font-bold tracking-widest" style={{ color: a.accentColor }}>
            {a.name}
          </span>
        </div>
      ))}
    </div>
  );
}
