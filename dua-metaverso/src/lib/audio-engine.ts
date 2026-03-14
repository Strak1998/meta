"use client";

export type AudioEngineMode = "microphone" | "stream" | "file" | "silence";

export interface AudioEngineState {
  mode: AudioEngineMode;
  streamUrl?: string;
  isActive: boolean;
  isMuted: boolean;
  level: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private animationFrame: number | null = null;
  private onLevelChange?: (level: number) => void;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private onSilenceAlert?: () => void;
  private lastNonZeroLevel = Date.now();

  mode: AudioEngineMode = "silence";
  isMuted = false;

  private getContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    return this.context;
  }

  async startMicrophone(): Promise<void> {
    await this.stop();
    const ctx = this.getContext();
    if (ctx.state === "suspended") await ctx.resume();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      const error = err as DOMException;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        throw new Error(
          "Permissão de microfone negada. Para conceder acesso: clica no ícone de cadeado na barra de endereço do browser e ativa o microfone. Em seguida, recarrega a página e tenta novamente."
        );
      }
      if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        throw new Error(
          "Nenhum microfone encontrado. Liga um microfone e tenta novamente."
        );
      }
      throw new Error(`Erro ao aceder ao microfone: ${error.message || error.name}`);
    }
    this.mediaStream = stream;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    this.sourceNode = ctx.createMediaStreamSource(stream);
    this.sourceNode.connect(compressor);
    compressor.connect(this.gainNode);
    this.gainNode.connect(this.analyser);

    this.mode = "microphone";
    this.startLevelMonitor();
  }

  async startStream(url: string): Promise<void> {
    await this.stop();
    const ctx = this.getContext();
    if (ctx.state === "suspended") await ctx.resume();

    const audio = new Audio();
    audio.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        audio.src = "";
        reject(
          new Error(
            "O stream não respondeu em 5 segundos. Verifica se o URL está correcto e acessível. Sugestão: testa o URL directamente no browser antes de o usar aqui."
          )
        );
      }, 5000);

      audio.oncanplay = () => {
        clearTimeout(timeout);
        resolve();
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        const code = audio.error?.code;
        if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          reject(new Error("Formato de áudio não suportado. Usa MP3, AAC ou Ogg."));
        } else if (code === MediaError.MEDIA_ERR_NETWORK) {
          reject(new Error("Erro de rede ao carregar o stream. Verifica a ligação e o URL."));
        } else {
          reject(new Error("Não foi possível carregar o stream de áudio. Verifica o URL e as definições de CORS."));
        }
      };

      audio.src = url;
      audio.autoplay = true;
      audio.load();
    });

    this.audioElement = audio;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 1.0;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;

    const el = ctx.createMediaElementSource(audio);
    el.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    audio.play().catch(() => {});
    this.mode = "stream";
    this.startLevelMonitor();
    this.startSilenceWatch();
  }

  async startFile(url: string): Promise<void> {
    await this.startStream(url);
    this.mode = "file";
  }

  async stop(): Promise<void> {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.animationFrame = null;
    this.silenceTimer = null;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch {}
      this.sourceNode = null;
    }

    this.analyser = null;
    this.gainNode = null;
    this.mode = "silence";
    this.onLevelChange?.(0);
  }

  mute(): void {
    this.isMuted = true;
    if (this.gainNode) this.gainNode.gain.value = 0;
    if (this.audioElement) this.audioElement.volume = 0;
  }

  unmute(): void {
    this.isMuted = false;
    if (this.gainNode) this.gainNode.gain.value = 1;
    if (this.audioElement) this.audioElement.volume = 1;
  }

  toggleMute(): void {
    this.isMuted ? this.unmute() : this.mute();
  }

  setOnLevelChange(fn: (level: number) => void): void {
    this.onLevelChange = fn;
  }

  setOnSilenceAlert(fn: () => void): void {
    this.onSilenceAlert = fn;
  }

  private startLevelMonitor(): void {
    if (!this.analyser) return;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    const tick = () => {
      if (!this.analyser) return;
      this.analyser.getByteFrequencyData(data);
      const sum = data.reduce((a, b) => a + b, 0);
      const avg = sum / data.length;
      const level = Math.min(100, Math.round((avg / 255) * 100 * 2));
      this.onLevelChange?.(level);
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  private startSilenceWatch(): void {
    this.lastNonZeroLevel = Date.now();
    const check = () => {
      if (this.mode !== "stream" && this.mode !== "file") return;
      const secondsSilent = (Date.now() - this.lastNonZeroLevel) / 1000;
      if (secondsSilent > 5) {
        this.onSilenceAlert?.();
      }
      this.silenceTimer = setTimeout(check, 1000);
    };
    this.silenceTimer = setTimeout(check, 1000);

    const origFn = this.onLevelChange;
    this.onLevelChange = (level) => {
      if (level > 0) this.lastNonZeroLevel = Date.now();
      origFn?.(level);
    };
  }
}

let _engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!_engine) _engine = new AudioEngine();
  return _engine;
}
