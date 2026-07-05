'use client';

import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ThemeInitializer() {
  useEffect(() => {
    const applyTheme = (settings: any) => {
      const root = document.documentElement;
      
      if (settings.primary_color) {
        root.style.setProperty('--primary-color', settings.primary_color);
      }
      
      if (settings.accent_color) {
        root.style.setProperty('--accent-color', settings.accent_color);
      }
      
      if (settings.typography) {
        root.style.setProperty(
          '--font-sans',
          `"${settings.typography}", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
        );
        // Dynamically load Google Font if not generic
        if (!['Inter', 'system-ui', 'monospace'].includes(settings.typography)) {
          const fontId = 'dynamic-google-font';
          let link = document.getElementById(fontId) as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          }
          link.href = `https://fonts.googleapis.com/css2?family=${settings.typography.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
        }
      }
      
      // Save properties locally for quick recovery/retrieval
      localStorage.setItem('auryn_theme_name', settings.restaurant_name || 'AURYN');
      localStorage.setItem('auryn_theme_primary', settings.primary_color || '#0A0A0A');
      localStorage.setItem('auryn_theme_accent', settings.accent_color || '#D4AF37');
      localStorage.setItem('auryn_theme_logo', settings.logo_url || '');
      localStorage.setItem('auryn_theme_welcome_title', settings.welcome_screen?.title || 'Welcome to AURYN');
      localStorage.setItem('auryn_theme_welcome_subtitle', settings.welcome_screen?.subtitle || 'Luxury Dining Intelligence');
    };

    // Load initial theme settings from Supabase
    const fetchInitialTheme = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 'global').maybeSingle();
      if (data) applyTheme(data);
    };
    fetchInitialTheme();

    // Subscribe to settings changes in real-time
    const channel = supabase.channel('theme-sync-channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.global' }, (payload) => {
        applyTheme(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
