export type DeviceTier = 'LOW' | 'MID' | 'HIGH';

export interface DeviceProfile {
  tier: DeviceTier;
  gpu: {
    tier: DeviceTier;
    renderer: string;
    vendor: string;
  };
  memory: {
    tier: DeviceTier;
    deviceMemory: number | null;
  };
  connection: {
    effectiveType: string | null;
    downlink: number | null;
    saveData: boolean;
  };
  screen: {
    pixelRatio: number;
    width: number;
    height: number;
    isPortrait: boolean;
    isTouch: boolean;
  };
  preferences: {
    reducedMotion: boolean;
    darkMode: boolean;
    reducedData: boolean;
  };
}

const LOW_GPU_PATTERNS = [
  /Mali-4/i,
  /Adreno\s*3/i,
  /Adreno\s*4/i,
  /PowerVR/i,
  /GE8/i,
  /SGX/i,
  /Vivante/i,
  /SwiftShader/i,
  /llvmpipe/i,
];

const LOW_GPU_CONDITIONAL_PATTERNS = [
  /Intel\s+HD\s+Graphics/i,
  /Intel\s+UHD\s+Graphics(?!\s*7)/i,
];

const MID_GPU_PATTERNS = [
  /Adreno\s*5/i,
  /Adreno\s*6/i,
  /Adreno\s*7/i,
  /Intel\s+Iris/i,
  /Intel\s+UHD\s*7/i,
  /Mali-G7/i,
  /Mali-G8/i,
];

const MID_GPU_CONDITIONAL_PATTERNS = [
  /Radeon\s+Graphics/i,
];

const HIGH_GPU_PATTERNS = [
  /NVIDIA/i,
  /GeForce/i,
  /RTX/i,
  /GTX/i,
  /Radeon\s+RX/i,
  /Radeon\s+Pro/i,
  /Intel\s+Arc/i,
  /Mali-G9/i,
];

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(value));
}

function detectGpu(deviceMemory: number | null): DeviceProfile['gpu'] {
  let renderer = 'unknown';
  let vendor = 'unknown';

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (gl && gl instanceof WebGLRenderingContext) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown';
        vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'unknown';
      }
      const loseExt = gl.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
    }
  } catch {
    // WebGL unavailable
  }

  const tier = classifyGpu(renderer, deviceMemory);

  return { tier, renderer, vendor };
}

function classifyGpu(renderer: string, deviceMemory: number | null): DeviceTier {
  if (matchesAny(renderer, LOW_GPU_PATTERNS)) {
    return 'LOW';
  }

  if (matchesAny(renderer, LOW_GPU_CONDITIONAL_PATTERNS)) {
    return 'LOW';
  }

  if (/Apple\s+GPU/i.test(renderer)) {
    if (deviceMemory !== null && deviceMemory < 4) {
      return 'LOW';
    }
    return 'MID';
  }

  if (matchesAny(renderer, HIGH_GPU_PATTERNS)) {
    return 'HIGH';
  }

  if (matchesAny(renderer, MID_GPU_PATTERNS)) {
    return 'MID';
  }

  if (matchesAny(renderer, MID_GPU_CONDITIONAL_PATTERNS)) {
    return 'MID';
  }

  return 'HIGH';
}

function detectMemory(): DeviceProfile['memory'] {
  const deviceMemory: number | null =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? (navigator as any).deviceMemory
      : null;

  let tier: DeviceTier;
  if (deviceMemory === null) {
    tier = 'MID';
  } else if (deviceMemory < 4) {
    tier = 'LOW';
  } else if (deviceMemory <= 8) {
    tier = 'MID';
  } else {
    tier = 'HIGH';
  }

  return { tier, deviceMemory };
}

function detectConnection(): DeviceProfile['connection'] {
  const conn = typeof navigator !== 'undefined' ? (navigator as any).connection : undefined;

  if (!conn) {
    return { effectiveType: null, downlink: null, saveData: false };
  }

  return {
    effectiveType: conn.effectiveType ?? null,
    downlink: conn.downlink ?? null,
    saveData: Boolean(conn.saveData),
  };
}

function detectScreen(): DeviceProfile['screen'] {
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  const height = typeof window !== 'undefined' ? window.innerHeight : 0;
  const isPortrait = height > width;
  const isTouch =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  return { pixelRatio, width, height, isPortrait, isTouch };
}

function detectPreferences(): DeviceProfile['preferences'] {
  if (typeof window === 'undefined') {
    return { reducedMotion: false, darkMode: false, reducedData: false };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const reducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches;

  return { reducedMotion, darkMode, reducedData };
}

const TIER_SCORE: Record<DeviceTier, number> = {
  LOW: 1,
  MID: 2,
  HIGH: 3,
};

function calculateOverallTier(
  gpuTier: DeviceTier,
  memoryTier: DeviceTier,
  connection: DeviceProfile['connection'],
  preferences: DeviceProfile['preferences']
): DeviceTier {
  const gpuWeight = 3;
  const memoryWeight = 2;
  const connectionWeight = 1;

  let connectionTier: DeviceTier;
  if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    connectionTier = 'LOW';
  } else if (connection.effectiveType === '3g') {
    connectionTier = 'MID';
  } else {
    connectionTier = 'HIGH';
  }

  const totalWeight = gpuWeight + memoryWeight + connectionWeight;
  const score =
    (TIER_SCORE[gpuTier] * gpuWeight +
      TIER_SCORE[memoryTier] * memoryWeight +
      TIER_SCORE[connectionTier] * connectionWeight) /
    totalWeight;

  let tier: DeviceTier;
  if (score < 1.5) {
    tier = 'LOW';
  } else if (score < 2.5) {
    tier = 'MID';
  } else {
    tier = 'HIGH';
  }

  if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    if (tier === 'HIGH') tier = 'MID';
  }

  if (connection.effectiveType === '3g' && tier === 'HIGH') {
    tier = 'MID';
  }

  if (preferences.reducedMotion && tier === 'HIGH') {
    tier = 'MID';
  }

  return tier;
}

function buildProfile(): DeviceProfile {
  const memory = detectMemory();
  const gpu = detectGpu(memory.deviceMemory);
  const connection = detectConnection();
  const screen = detectScreen();
  const preferences = detectPreferences();
  const tier = calculateOverallTier(gpu.tier, memory.tier, connection, preferences);

  return Object.freeze({
    tier,
    gpu: Object.freeze(gpu),
    memory: Object.freeze(memory),
    connection: Object.freeze(connection),
    screen: Object.freeze(screen),
    preferences: Object.freeze(preferences),
  }) as DeviceProfile;
}

let cachedProfile: DeviceProfile | null = null;

export function getDeviceProfile(): DeviceProfile {
  if (cachedProfile) return cachedProfile;
  cachedProfile = buildProfile();
  return cachedProfile;
}
