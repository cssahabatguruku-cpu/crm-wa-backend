import React, { useState } from 'react';
import { XIcon, MegaphoneIcon } from '../Icons';

export default function BroadcastModal({ isOpen, onClose, contacts, onSendBroadcast }) {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetSegment, setTargetSegment] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleStartBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsProcessing(true);
    await onSendBroadcast(broadcastMessage, targetSegment);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 md:p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-emerald-600">
            <MegaphoneIcon />
            <h3 className="font-bold text-slate-800 text-sm md:text-base">WhatsApp Broadcast</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon />
          </button>
        </div>

        <div className="space-y-3.5 my-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Target Penerima:</label>
            <select
              value={targetSegment}
              onChange={(e) => setTargetSegment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">Semua Kontak ({contacts.length} orang)</option>
              <option value="Hot Lead">Khusus Hot Lead</option>
              <option value="Pelanggan">Khusus Pelanggan Aktif</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Isi Pesan Siaran:</label>
            <textarea
              rows={4}
              placeholder="Tulis pesan pengumuman / promosi..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Batal
          </button>
          <button
            onClick={handleStartBroadcast}
            disabled={isProcessing || !broadcastMessage.trim()}
            className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow disabled:opacity-50"
          >
            {isProcessing ? 'Mengirim Siaran...' : 'Kirim Siaran'}
          </button>
        </div>
      </div>
    </div>
  );
}