import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function ChannelSwitcher({ supabaseUrl, supabaseKey, activeChannel, onSelectChannel }) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChannels = async () => {
      const { data } = await supabase.from('channels').select('*').eq('is_active', true);
      if (data && data.length > 0) {
        setChannels(data);
        if (!activeChannel) {
          onSelectChannel(data[0]); // Default pilih akun pertama
        }
      }
      setLoading(false);
    };
    fetchChannels();
  }, [supabaseUrl, supabaseKey]);

  if (loading) return <span className="text-xs text-slate-400">Loading akun...</span>;

  return (
    <div className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-xl border border-slate-700">
      <span className="text-xs text-slate-400">Akun Aktif:</span>
      <select
        value={activeChannel?.id || ''}
        onChange={(e) => {
          const selected = channels.find((c) => c.id === e.target.value);
          if (selected) onSelectChannel(selected);
        }}
        className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
      >
        {channels.map((ch) => (
          <option key={ch.id} value={ch.id} className="bg-slate-900 text-white">
            {ch.name} (+{ch.phone_number || 'WA'})
          </option>
        ))}
      </select>
    </div>
  );
}