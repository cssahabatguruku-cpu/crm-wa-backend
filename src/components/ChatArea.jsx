import React, { useRef, useEffect } from 'react';
import { ArrowLeftIcon, FileTextIcon, CreditCardIcon, UserIcon, SendIcon, CheckIcon, CheckCheckIcon, InboxIcon } from './Icons';

export default function ChatArea({
  selectedContact,
  messages,
  inputText,
  setInputText,
  isSending,
  onSendMessage,
  onBackToContacts,
  onToggleCrm,
  showCrmPanel,
  onOpenTemplates,
  onOpenInvoice,
}) {
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedContact) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 p-6 text-center bg-slate-50">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <InboxIcon />
        </div>
        <p className="text-sm font-semibold text-slate-600">Pilih Kontak Pelanggan</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Klik salah satu obrolan dari daftar sebelah kiri untuk mulai membaca dan membalas pesan.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-50 min-w-0 h-full relative">
      {/* Header Obrolan */}
      <div className="h-14 sm:h-16 px-3 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            onClick={onBackToContacts}
            className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-full flex items-center justify-center shrink-0"
            title="Kembali"
          >
            <ArrowLeftIcon />
          </button>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
            {(selectedContact.name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
              {selectedContact.name || selectedContact.phone_number}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              +{selectedContact.phone_number}
            </p>
          </div>
        </div>

        {/* Tombol Header */}
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={onOpenTemplates}
            className="px-2 sm:px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition font-medium"
          >
            <FileTextIcon />
            <span className="hidden sm:inline">Template</span>
          </button>
          <button
            onClick={onOpenInvoice}
            className="px-2 sm:px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 transition font-medium"
          >
            <CreditCardIcon />
            <span className="hidden sm:inline">Tagihan</span>
          </button>
          <button
            onClick={onToggleCrm}
            className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition ${
              showCrmPanel ? 'bg-slate-100 text-emerald-600' : ''
            }`}
          >
            <UserIcon />
          </button>
        </div>
      </div>

      {/* Gelembung Obrolan */}
      <div ref={chatContainerRef} className="flex-1 p-3 md:p-6 overflow-y-auto space-y-3 md:space-y-4">
        <div className="text-center my-1 md:my-2">
          <span className="px-3 py-1 bg-white/90 border border-slate-200 rounded-full text-[10px] md:text-[11px] text-slate-500 shadow-sm">
            Percakapan Terenkripsi WhatsApp Cloud API
          </span>
        </div>

        {messages.map((msg) => {
          const isOutbound = msg.direction === 'outbound';
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 md:px-4 md:py-2.5 shadow-sm text-xs md:text-sm relative leading-relaxed ${
                  isOutbound
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line break-words">{msg.content}</p>
                <div
                  className={`flex items-center justify-end gap-1.5 mt-1 text-[9px] md:text-[10px] ${
                    isOutbound ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  <span>
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                  {isOutbound && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheckIcon color="text-cyan-200" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheckIcon color="text-emerald-200" />
                      ) : (
                        <CheckIcon />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Pengetikan */}
      <div className="p-2.5 md:p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ketik balasan pesan WhatsApp..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 px-3.5 py-2.5 md:px-4 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 md:px-5 md:py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl flex items-center justify-center gap-1.5 font-medium text-xs md:text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <SendIcon />
            <span className="hidden sm:inline">{isSending ? 'Mengirim...' : 'Kirim'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
