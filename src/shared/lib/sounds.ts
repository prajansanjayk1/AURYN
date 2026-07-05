/**
 * Web Audio API synthesizer for elegant, premium glassmorphic UI sounds.
 * Avoids the need for external asset loading and works 100% offline.
 */

export type UISoundType = 
  | 'click' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'notification' 
  | 'order_accepted' 
  | 'food_ready' 
  | 'runner_assigned' 
  | 'payment_success';

export function playUISound(type: UISoundType) {
  if (typeof window === 'undefined') return;

  // Check if sounds are disabled by user in settings
  const disabled = localStorage.getItem('auryn_sounds_disabled') === 'true';
  if (disabled) return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    switch (type) {
      case 'click': {
        // Subtle, high-frequency click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.06);
        break;
      }

      case 'success':
      case 'payment_success': {
        // High-end luxury ascending chime
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
        break;
      }

      case 'notification':
      case 'order_accepted': {
        // Elegant dual-note chime (G5 -> C6)
        const notes = [783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.1, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.3);
        });
        break;
      }

      case 'food_ready': {
        // Clear, alerting chime (E5 -> A5 -> E6)
        const notes = [659.25, 880.00, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.1, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.35);
        });
        break;
      }

      case 'runner_assigned': {
        // Ascending tri-tone (C5 -> E5 -> G5)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0.08, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.2);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.25);
        });
        break;
      }

      case 'warning': {
        // Soft descending alert (E5 -> C5)
        const notes = [659.25, 523.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);

          gain.gain.setValueAtTime(0.08, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.3);

          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.35);
        });
        break;
      }

      case 'error': {
        // Double low pip
        const notes = [220, 220];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.12, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.12);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('[Sounds Helper] Web Audio playback failed:', e);
  }
}
