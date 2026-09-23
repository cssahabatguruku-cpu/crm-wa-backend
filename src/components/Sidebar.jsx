import React from 'react';
import { SearchIcon, RefreshCwIcon, SettingsIcon, FileTextIcon, CreditCardIcon, MegaphoneIcon } from './Icons';

export default function Sidebar({
  contacts,
  selectedContact,
  onSelectContact,
  searchQuery,
  setSearchQuery,
  activeFilterTab,
  setActiveFilterTab,
  contactTags,
  isRefreshing,
  onRefresh,
  onOpenSettings,
  onOpenTemplates,
  onOpenInvoice,
  onOpenBroadcast,
}) {
  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchName = (c.name || '').toLowerCase().includes(query);
    const matchPhone = (c.phone_number || '').includes(query);
    return matchName || matchPhone;
  });

  return (
    <div
      className={`${
        selectedContact ? 'hidden md:flex' : 'flex'
      } w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-col shrink-0 h-full`}
    >
      {/* Header Kontak */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
            WA
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg text-slate-900 leading-tight">WhatsApp CRM</h1>
            <p className="text-[11px] text-slate-500">Sahabat Guru Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            title="Segarkan data"
            className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCwIcon spinning={isRefreshing} />
          </button>
          <button
            onClick={onOpenSettings}
            className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg transition"
            title="Pengaturan"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* Input Pencarian */}
      <div className="p-3 border-b border-slate-100 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Cari nama atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Tab Segmentasi */}
      <div className="px-3 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-xs shrink-0">
        {['all', 'Hot Lead', 'Pelanggan'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilterTab(tab)}
            className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition ${
              activeFilterTab === tab
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab === 'all' ? 'Semua Obrolan' : tab}
          </button>
        ))}
      </div>

      {/* List Kontak */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs md:text-sm">
            Tidak ada kontak ditemukan.
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isSelected = selectedContact?.id === contact.id;
            const tags = contactTags[contact.id] || ['Hot Lead'];

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition active:bg-slate-100 ${
                  isSelected ? 'bg-emerald-50/80 md:border-l-4 md:border-emerald-500' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {(contact.name || contact.phone_number || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-sm text-slate-800 truncate">
                      {contact.name || contact.phone_number}
                    </h2>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {contact.created_at
                        ? new Date(contact.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">+{contact.phone_number}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {tags.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden border-t border-slate-200 bg-white p-2 flex justify-around items-center shrink-0">
        <button onClick={onOpenBroadcast} className="flex flex-col items-center gap-1 py-1 px-2 text-slate-600 hover:text-emerald-600">
          <MegaphoneIcon />
          <span className="text-[10px] font-medium">Broadcast</span>
        </button>
        <button onClick={onOpenTemplates} className="flex flex-col items-center gap-1 py-1 px-2 text-slate-600 hover:text-emerald-600">
          <FileTextIcon />
          <span className="text-[10px] font-medium">Template</span>
        </button>
        <button onClick={onOpenInvoice} className="flex flex-col items-center gap-1 py-1 px-2 text-slate-600 hover:text-emerald-600">
          <CreditCardIcon />
          <span className="text-[10px] font-medium">Tagihan</span>
        </button>
        <button onClick={onOpenSettings} className="flex flex-col items-center gap-1 py-1 px-2 text-slate-600 hover:text-emerald-600">
          <SettingsIcon />
          <span className="text-[10px] font-medium">Pengaturan</span>
        </button>
      </div>
    </div>
  );
}