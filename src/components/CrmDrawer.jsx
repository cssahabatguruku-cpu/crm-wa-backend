import React from 'react';
import { XIcon, TagIcon, CreditCardIcon } from './Icons';

export default function CrmDrawer({
  isOpen,
  onClose,
  selectedContact,
  contactTags,
  newTagInput,
  setNewTagInput,
  onAddTag,
  onRemoveTag,
  totalMessages,
  onOpenInvoice,
}) {
  if (!isOpen || !selectedContact) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-end md:static md:z-auto md:bg-transparent">
      <div className="w-80 md:w-72 bg-white h-full border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl md:shadow-none">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Detail Pelanggan</span>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <XIcon />
            </button>
          </div>

          <div className="text-center pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xl mx-auto mb-2 shadow-inner">
              {(selectedContact.name || 'U')[0].toUpperCase()}
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              {selectedContact.name || selectedContact.phone_number}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">+{selectedContact.phone_number}</p>
          </div>

          {/* Tag Segmentasi */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <TagIcon /> Label Segmentasi
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(contactTags[selectedContact.id] || ['Hot Lead', 'Pelanggan']).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1 border border-emerald-200"
                >
                  {tag}
                  <button onClick={() => onRemoveTag(tag)} className="hover:text-rose-600">
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tambah label..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddTag(newTagInput);
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => onAddTag(newTagInput)}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Info Teknis */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Total Pesan:</span>
              <span className="font-semibold text-slate-700">{totalMessages}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Saluran API:</span>
              <span className="font-semibold text-emerald-600">WhatsApp Meta Cloud</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onOpenInvoice();
            }}
            className="w-full py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition"
          >
            <CreditCardIcon /> Kirim Tagihan WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}