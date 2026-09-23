import React, { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_SUPABASE_URL = 'https://axveczjyamcljxqfnssv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dmVjemp5YW1jbGp4cWZuc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzA2NjYsImV4cCI6MjEwNTcwNjY2Nn0.CDW9IxJPQeIWNEoqUv5cM3Uqlr0k9GYVaBOzLtt9G0Q';

// Endpoint relatif Vercel (satu domain, bebas kendala CORS)
const DEFAULT_API_URL = '/api/send-message';

const SendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CheckCheckIcon = ({ color = 'text-blue-500' }) => (
  <svg className={`w-3.5 h-3.5 ${color} inline`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M9 13l4 4L23 7" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const RefreshCwIcon = ({ spinning }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const FileTextIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InboxIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const QUICK_TEMPLATES = [
  {
    id: 1,
    title: 'Sapaan Pelanggan',
    text: 'Halo! Terima kasih telah menghubungi Sahabat Guru. Ada yang bisa kami bantu hari ini?'
  },
  {
    id: 2,
    title: 'Konfirmasi Pembayaran',
    text: 'Pembayaran Anda telah kami terima dengan baik. Akses materi pelatihan akan segera kami aktifkan. Terima kasih!'
  },
  {
    id: 3,
    title: 'Follow Up Prospek',
    text: 'Halo Bapak/Ibu, apakah ada informasi tambahan yang diperlukan mengenai paket keanggotaan Sahabat Guru?'
  },
  {
    id: 4,
    title: 'Info Resi Pengiriman',
    text: 'Halo! Pesanan perlengkapan pelatihan Anda telah dikirim via ekspedisi. Nomor resi pengiriman Anda adalah: [ISI_RESI]'
  }
];

export default function App() {
  const [supabaseUrl, setSupabaseUrl] = useState(DEFAULT_SUPABASE_URL);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(DEFAULT_SUPABASE_ANON_KEY);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState('all');

  const [contactTags, setContactTags] = useState({});
  const [newTagInput, setNewTagInput] = useState('');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCrmPanel, setShowCrmPanel] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    item: 'Paket Berlangganan Sahabat Guru',
    amount: '150000',
    account: 'BCA 123-456-7890 a/n Sahabat Guru'
  });

  const chatContainerRef = useRef(null);

  const showNotice = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Handler memilih kontak dengan pushState browser history
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'chat', contactId: contact.id }, '');
    }
  };

  // Handler tombol kembali (baik tombol UI maupun gesture)
  const handleBackToContacts = () => {
    if (typeof window !== 'undefined' && window.history.state?.page === 'chat') {
      window.history.back();
    } else {
      setSelectedContact(null);
    }
  };

  // Tangani tombol back fisik/gesture smartphone (Android back / swipe back)
  useEffect(() => {
    const handlePopState = (event) => {
      if (showTemplateModal) {
        setShowTemplateModal(false);
        return;
      }
      if (showInvoiceModal) {
        setShowInvoiceModal(false);
        return;
      }
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return;
      }
      if (showCrmPanel) {
        setShowCrmPanel(false);
        return;
      }
      // Jika di layar chat, kembali ke daftar kontak
      setSelectedContact(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showTemplateModal, showInvoiceModal, showSettingsModal, showCrmPanel]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/contacts?select=*&order=created_at.desc`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: Gagal memuat data kontak`);
      const data = await res.json();
      setContacts(data || []);

      // Pada layar desktop (lebar >= 768px), pilih kontak pertama secara otomatis
      if (typeof window !== 'undefined' && window.innerWidth >= 768 && data && data.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (err) {
      console.warn('Gagal memuat kontak:', err.message);
    }
  }, [supabaseUrl, supabaseAnonKey, selectedContact]);

  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/messages?contact_id=eq.${contactId}&order=created_at.asc`,
        {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`
          }
        }
      );

      if (!res.ok) return;
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.warn('Gagal memuat pesan:', err.message);
    }
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (selectedContact?.id) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact, fetchMessages]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedContact?.id) {
        fetchMessages(selectedContact.id);
      }
    }, 3500);
    return () => clearInterval(timer);
  }, [selectedContact, fetchMessages]);

  // Scroll otomatis hanya pada wadah chat tanpa menggeser header layar
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content || !selectedContact) return;

    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content,
      direction: 'outbound',
      status: 'sending',
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: selectedContact.phone_number,
          contact_id: selectedContact.id,
          message_text: content
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim pesan via API');
      }

      showNotice('Pesan balasan WhatsApp berhasil terkirim!', 'success');
      fetchMessages(selectedContact.id);
    } catch (err) {
      console.error('Send error:', err);
      showNotice(`Gagal mengirim: ${err.message}`, 'error');
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleAddTag = (tag) => {
    if (!selectedContact || !tag.trim()) return;
    const cid = selectedContact.id;
    const currentTags = contactTags[cid] || ['Pelanggan'];
    if (!currentTags.includes(tag.trim())) {
      setContactTags({ ...contactTags, [cid]: [...currentTags, tag.trim()] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    if (!selectedContact) return;
    const cid = selectedContact.id;
    const currentTags = contactTags[cid] || [];
    setContactTags({
      ...contactTags,
      [cid]: currentTags.filter((t) => t !== tagToRemove)
    });
  };

  const handleSendInvoice = () => {
    const formattedAmount = Number(invoiceData.amount).toLocaleString('id-ID');
    const invoiceMsg = `*INVOICE TAGIHAN PEMBAYARAN*\n----------------------------------\nLayanan: *${invoiceData.item}*\nTotal: *Rp ${formattedAmount}*\n\nSilakan transfer ke:\n*${invoiceData.account}*\n----------------------------------\nKirimkan bukti transfer di obrolan ini setelah transaksi berhasil. Terima kasih!`;
    setShowInvoiceModal(false);
    handleSendMessage(invoiceMsg);
  };

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchName = (c.name || '').toLowerCase().includes(query);
    const matchPhone = (c.phone_number || '').includes(query);
    return matchName || matchPhone;
  });

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden flex">
      {/* Toast Notifikasi Melayang */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 transition-all max-w-[90vw] ${
            notification.type === 'error'
              ? 'bg-rose-600 text-white'
              : notification.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
            <XIcon />
          </button>
        </div>
      )}

      {/* 1. Navigasi Mini Desktop (Sembunyi di HP, Tampil di md:flex) */}
      <div className="hidden md:flex w-16 bg-slate-900 flex-col items-center py-4 justify-between border-r border-slate-800 shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
            WA
          </div>
          <button
            title="Kotak Masuk"
            className="p-3 text-emerald-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
          >
            <InboxIcon />
          </button>
          <button
            title="Template Balasan"
            onClick={() => setShowTemplateModal(true)}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <FileTextIcon />
          </button>
          <button
            title="Kirim Tagihan"
            onClick={() => setShowInvoiceModal(true)}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <CreditCardIcon />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            title="Pengaturan Integrasi"
            onClick={() => setShowSettingsModal(true)}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>

      {/* 2. Kolom Daftar Kontak Pelanggan */}
      <div
        className={`${
          selectedContact ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-col shrink-0 h-full`}
      >
        {/* Header Kontak */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="md:hidden w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
              WA
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg text-slate-900 leading-tight">WhatsApp CRM</h1>
              <p className="text-[11px] text-slate-500">Sahabat Guru Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await fetchContacts();
                if (selectedContact) await fetchMessages(selectedContact.id);
                setIsRefreshing(false);
              }}
              title="Segarkan data kontak & pesan"
              className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCwIcon spinning={isRefreshing} />
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg transition"
              title="Pengaturan"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>

        {/* Kolom Pencarian Kontak */}
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

        {/* Tab Segmentasi / Filter */}
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

        {/* Daftar Kontak Scrollable */}
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
                  onClick={() => handleSelectContact(contact)}
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
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      +{contact.phone_number}
                    </p>
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
                        >
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

        {/* Navigasi Bawah Khusus Layar HP */}
        <div className="md:hidden border-t border-slate-200 bg-white p-2 flex justify-around items-center shrink-0">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 text-slate-600 hover:text-emerald-600"
          >
            <FileTextIcon />
            <span className="text-[10px] font-medium">Template</span>
          </button>
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 text-slate-600 hover:text-emerald-600"
          >
            <CreditCardIcon />
            <span className="text-[10px] font-medium">Tagihan</span>
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex flex-col items-center gap-1 py-1 px-3 text-slate-600 hover:text-emerald-600"
          >
            <SettingsIcon />
            <span className="text-[10px] font-medium">Pengaturan</span>
          </button>
        </div>
      </div>

      {/* 3. Kolom Ruang Obrolan Percakapan */}
      <div
        className={`${
          selectedContact ? 'flex' : 'hidden md:flex'
        } flex-1 flex-col bg-slate-50 min-w-0 h-full relative`}
      >
        {selectedContact ? (
          <>
            {/* Header Ruang Obrolan (Selalu Tampak & Kokoh di Atas) */}
            <div className="h-14 sm:h-16 px-3 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-20">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {/* Tombol Kembali Khusus HP */}
                <button
                  onClick={handleBackToContacts}
                  className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 active:bg-slate-100 rounded-full flex items-center justify-center shrink-0"
                  title="Kembali ke Daftar Kontak"
                  aria-label="Kembali"
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

              {/* Tombol Aksi Header Obrolan */}
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="px-2 sm:px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition font-medium"
                  title="Gunakan Template"
                >
                  <FileTextIcon />
                  <span className="hidden sm:inline">Template</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="px-2 sm:px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 transition font-medium"
                  title="Buat Tagihan"
                >
                  <CreditCardIcon />
                  <span className="hidden sm:inline">Tagihan</span>
                </button>
                <button
                  onClick={() => setShowCrmPanel(!showCrmPanel)}
                  className={`p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition ${
                    showCrmPanel ? 'bg-slate-100 text-emerald-600' : ''
                  }`}
                  title="Buka Data CRM Pelanggan"
                >
                  <UserIcon />
                </button>
              </div>
            </div>

            {/* Gelembung Pesan Masuk & Keluar */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-3 md:p-6 overflow-y-auto space-y-3 md:space-y-4"
            >
              <div className="text-center my-1 md:my-2">
                <span className="px-3 py-1 bg-white/90 border border-slate-200 rounded-full text-[10px] md:text-[11px] text-slate-500 shadow-sm">
                  Percakapan Terenkripsi WhatsApp Cloud API
                </span>
              </div>

              {messages.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                  >
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
                            ? new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
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

            {/* Kolom Pengetikan Balasan Pesan */}
            <div className="p-2.5 md:p-4 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <InboxIcon />
            </div>
            <p className="text-sm font-semibold text-slate-600">Pilih Kontak Pelanggan</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Klik salah satu obrolan dari daftar sebelah kiri untuk mulai membaca dan membalas pesan.
            </p>
          </div>
        )}
      </div>

      {}
      {/* 4. Panel CRM Pelanggan (Desktop Sidebar & Mobile Drawer) */}
      {showCrmPanel && selectedContact && (
        <div className="fixed inset-0 z-40 bg-black/40 flex justify-end md:static md:z-auto md:bg-transparent">
          <div className="w-80 md:w-72 bg-white h-full border-l border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl md:shadow-none">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-400">Detail Pelanggan</span>
                <button
                  onClick={() => setShowCrmPanel(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
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

              {/* Manajemen Label & Tagging Segmentasi */}
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
                      <button onClick={() => handleRemoveTag(tag)} className="hover:text-rose-600">
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
                        handleAddTag(newTagInput);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs hover:bg-slate-700 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Informasi Teknis Kontak */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Total Pesan:</span>
                  <span className="font-semibold text-slate-700">{messages.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Saluran API:</span>
                  <span className="font-semibold text-emerald-600">WhatsApp Meta Cloud</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Tercatat Sejak:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedContact.created_at
                      ? new Date(selectedContact.created_at).toLocaleDateString('id-ID')
                      : 'Hari ini'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCrmPanel(false);
                  setShowInvoiceModal(true);
                }}
                className="w-full py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition"
              >
                <CreditCardIcon /> Kirim Tagihan WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {/* 5. Modal Template Balasan Cepat */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Template Balasan Cepat</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>
            <div className="space-y-2.5 my-4 max-h-72 overflow-y-auto">
              {QUICK_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    setInputText(tmpl.text);
                    setShowTemplateModal(false);
                  }}
                  className="p-3 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl cursor-pointer transition text-left"
                >
                  <p className="font-semibold text-xs text-slate-800">{tmpl.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal Tagihan (Invoice) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Kirim Tagihan (Invoice)</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>
            <div className="space-y-3 my-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Item / Layanan:
                </label>
                <input
                  type="text"
                  value={invoiceData.item}
                  onChange={(e) => setInvoiceData({ ...invoiceData, item: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nominal (Rp):
                </label>
                <input
                  type="number"
                  value={invoiceData.amount}
                  onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Instruksi Transfer:
                </label>
                <input
                  type="text"
                  value={invoiceData.account}
                  onChange={(e) => setInvoiceData({ ...invoiceData, account: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={handleSendInvoice}
                className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow"
              >
                Kirim ke WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Pengaturan Integrasi */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-5 md:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Pengaturan Integrasi CRM</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>
            <div className="space-y-3.5 my-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Supabase Anon Public Key:
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Send-Message API Endpoint:
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setShowSettingsModal(false);
                fetchContacts();
                showNotice('Pengaturan integrasi disimpan.', 'success');
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow"
            >
              Simpan & Hubungkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}