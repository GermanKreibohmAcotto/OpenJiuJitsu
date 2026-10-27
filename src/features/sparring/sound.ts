/** Short beep through Web Audio; silently does nothing when unavailable. */
export function beep(durationMs = 600, frequency = 880): void {
  try {
    const Ctor: typeof AudioContext | undefined =
      typeof window === 'undefined'
        ? undefined
        : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.onended = () => void ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {
    // Audio is a nicety; ignore autoplay or device errors.
  }
}

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

/** Requests a screen wake lock when supported; returns a release function. */
export function keepAwake(): () => void {
  let sentinel: WakeLockSentinelLike | null = null;
  let released = false;
  const wakeLock = (navigator as unknown as { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } })
    .wakeLock;
  wakeLock
    ?.request('screen')
    .then((s) => {
      if (released) void s.release();
      else sentinel = s;
    })
    .catch(() => undefined);
  return () => {
    released = true;
    void sentinel?.release().catch(() => undefined);
  };
}
