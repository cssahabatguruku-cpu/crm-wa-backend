import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import TemplateModal from './components/modals/TemplateModal';
import BillingModal from './components/modals/BillingModal';
import ContactModal from './components/modals/ContactModal';
import ContactsPage from './pages/ContactsPage';
import BroadcastListsPage from './pages/BroadcastListsPage';
import TemplatesPage from './pages/TemplatesPage';
import {
  SendIcon,
  ArrowLeftIcon,
  CheckIcon,
  CheckCheckIcon,
  SearchIcon,
  RefreshCwIcon,
  TagIcon,
  FileTextIcon,
  CreditCardIcon,
  UserIcon,
  XIcon,
  InboxIcon,
} from './components/Icons';

const DEFAULT_SUPABASE_URL = 'https://axveczjyamcljxqfnssv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dmVjemp5YW1jbGp4cWZuc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzA2NjYsImV4cCI6MjEwNTcwNjY2Nn0.CDW9IxJPQeIWNEoqUv5cM3Uqlr0k9GYVaBOzLtt9G0Q';
const DEFAULT_API_URL = '/api/send-message';

const supabase = createClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);

export default function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat' | 'contacts' | 'broadcast' | 'templates'
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
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCrmPanel, setShowCrmPanel] = useState(false);

  const selectedContactRef = useRef(selectedContact);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  const [activeChannel] = useState({
    name: 'Sahabat Guru (Centang Biru)',
    number: '+62 823-2272-6989',
    wabaId: '163200896887310',
    verified: true,
  });

  const chatContainerRef = useRef(null);

  const showNotice = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Clean Inbox Fetch: HANYA TAMPILKAN KONTAK YANG PERNAH MEMBALAS (ADA PESAN INBOUND)
  const fetchActiveChats = useCallback(async () => {
    try {
      const { data: contactsData, error: cErr } = await supabase.from('contacts').select('*');
      if (cErr) throw cErr;

      const { data: messagesData, error: mErr } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (mErr) throw mErr;

      const messageMap = {};
      const unreadMap = {};
      const contactsWithInbound = new Set();

      (messagesData || []).forEach((msg) => {
        // Tandai jika kontak pernah mengirimkan balasan (inbound)
        if (msg.direction === 'inbound') {
          contactsWithInbound.add(msg.contact_id);
        }

        if (!messageMap[msg.contact_id]) {
          messageMap[msg.contact_id] = msg;
        }

        if (msg.direction === 'inbound' && msg.status !== 'read') {
          unreadMap[msg.contact_id] = (unreadMap[msg.contact_id] || 0) + 1;
        }
      });

      // Filter: Hanya sertakan kontak yang memiliki balasan inbound
      const activeContacts = (contactsData || [])
        .filter((c) => contactsWithInbound.has(c.id))
        .map((c) => {
          const isCurrentlySelected = selectedContactRef.current?.id === c.id;
          return {
            ...c,
            last_message: messageMap[c.id]?.content || '',
            last_message_time: messageMap[c.id]?.created_at || c.created_at,
            unread_count: isCurrentlySelected ? 0 : unreadMap[c.id] || 0,
          };
        })
        .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time));

      setContacts(activeContacts);

      if (
        typeof window !== 'undefined' &&
        window.innerWidth >= 768 &&
        activeContacts.length > 0 &&
        !selectedContactRef.current
      ) {
        setSelectedContact(activeContacts[0]);
      }
    } catch (err) {
      console.warn('Gagal memuat obrolan aktif:', err.message);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('contact_id', contactId)
        .eq('direction', 'inbound')
        .neq('status', 'read');

      setContacts((prev) => prev.map((c) => (c.id === contactId ? { ...c, unread_count: 0 } : c)));
    } catch (err) {
      console.warn('Gagal memuat pesan:', err.message);
    }
  }, []);

  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, unread_count: 0 } : c)));

    try {
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('contact_id', contact.id)
        .eq('direction', 'inbound')
        .neq('status', 'read');
    } catch (err) {
      console.warn('Gagal update status read:', err.message);
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'chat', contactId: contact.id }, '');
    }
  };

  useEffect(() => {
    fetchActiveChats();

    const channel = supabase
      .channel('realtime-messages-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        fetchActiveChats();
        const activeSelected = selectedContactRef.current;

        if (payload.eventType === 'INSERT') {
          if (activeSelected && activeSelected.id === payload.new.contact_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });

            supabase.from('messages').update({ status: 'read' }).eq('id', payload.new.id).then();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveChats]);

  useEffect(() => {
    if (selectedContact?.id) fetchMessages(selectedContact.id);
  }, [selectedContact, fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBackToContacts = () => {
    if (typeof window !== 'undefined' && window.history.state?.page === 'chat') {
      window.history.back();
    } else {
      setSelectedContact(null);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content || !selectedContact) return;

    setIsSending(true);
    const tempId = 'temp-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content,
        direction: 'outbound',
        status: 'sending',
        created_at: new Date().toISOString(),
      },
    ]);
    setInputText('');

    try {
      const response = await fetch(DEFAULT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: selectedContact.phone_number,
          contact_id: selectedContact.id,
          message_text: content,
        }),
      });
      if (!response.ok) throw new Error('Gagal mengirim via API backend');
      showNotice('Pesan WhatsApp terkirim!', 'success');
      fetchMessages(selectedContact.id);
      fetchActiveChats();
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchName = (c.name || '').toLowerCase().includes(query);
    const matchPhone = (c.phone_number || '').includes(query);
    return matchName || matchPhone;
  });

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden flex">
      {/* Toast Notification */}
      {notification && (
        <div
          className={
            'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 ' +
            (notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white')
          }
        >
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <XIcon />
          </button>
        </div>
      )}

      {/* Mini Desktop Sidebar Navigasi Utama */}
      <div className="hidden md:flex w-16 bg-slate-900 flex-col items-center py-4 justify-between border-r border-slate-800 shrink-0">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg mb-2">
            SG
          </div>

          <button
            title="Kotak Masuk Chat (Respon Pelanggan)"
            onClick={() => setCurrentView('chat')}
            className={
              'p-3 rounded-xl transition ' +
              (currentView === 'chat' ? 'text-emerald-400 bg-slate-800 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800')
            }
          >
            <InboxIcon />
          </button>

          <button
            title="Master Data Kontak & Import Excel"
            onClick={() => setCurrentView('contacts')}
            className={
              'p-3 rounded-xl transition ' +
              (currentView === 'contacts' ? 'text-emerald-400 bg-slate-800 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800')
            }
          >
            <UserIcon />
          </button>

          <button
            title="Paket & Riwayat Broadcast"
            onClick={() => setCurrentView('broadcast')}
            className={
              'p-3 rounded-xl transition font-bold text-base ' +
              (currentView === 'broadcast' ? 'text-emerald-400 bg-slate-800 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800')
            }
          >
            📢
          </button>

          <button
            title="Dashboard Template Broadcast Meta (HSM)"
            onClick={() => setCurrentView('templates')}
            className={
              'p-3 rounded-xl transition ' +
              (currentView === 'templates' ? 'text-emerald-400 bg-slate-800 shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800')
            }
          >
            <FileTextIcon />
          </button>

          <button
            title="Saldo & Tagihan Meta WABA"
            onClick={() => setShowBillingModal(true)}
            className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <CreditCardIcon />
          </button>
        </div>
      </div>

      {/* MAIN VIEW ROUTING: CHAT | CONTACTS DASHBOARD | BROADCAST LISTS | TEMPLATES DASHBOARD */}
      {currentView === 'contacts' ? (
        <ContactsPage
          supabaseUrl={DEFAULT_SUPABASE_URL}
          supabaseKey={DEFAULT_SUPABASE_ANON_KEY}
          onSelectContact={async (phoneNumber) => {
            const { data } = await supabase.from('contacts').select('*').eq('phone_number', phoneNumber).single();

            if (data) {
              handleSelectContact(data);
            } else {
              handleSelectContact({ phone_number: phoneNumber, name: phoneNumber });
            }
            setCurrentView('chat');
          }}
        />
      ) : currentView === 'broadcast' ? (
        <BroadcastListsPage
          supabaseUrl={DEFAULT_SUPABASE_URL}
          supabaseKey={DEFAULT_SUPABASE_ANON_KEY}
          onSelectContact={async (phoneNumber) => {
            const { data } = await supabase.from('contacts').select('*').eq('phone_number', phoneNumber).single();

            if (data) {
              handleSelectContact(data);
            } else {
              handleSelectContact({ phone_number: phoneNumber, name: phoneNumber });
            }
            setCurrentView('chat');
          }}
        />
      ) : currentView === 'templates' ? (
        <TemplatesPage
          onSelectTemplateForChat={(templateText) => {
            setInputText(templateText);
            setCurrentView('chat');
          }}
        />
      ) : (
        <>
          {/* Kolom Daftar Obrolan Kiri */}
          <div
            className={
              (selectedContact ? 'hidden md:flex' : 'flex') +
              ' w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex-col shrink-0 h-full'
            }
          >
            {/* Header Kontak */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  SG
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-bold text-sm md:text-base text-slate-900 leading-tight">Sahabat Guru</h1>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Nomor Official Terhubung"></span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium">{activeChannel.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentView('contacts')}
                  title="Master Dashboard Kontak"
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                >
                  <span>+ Kontak</span>
                </button>
                <button
                  onClick={async () => {
                    setIsRefreshing(true);
                    await fetchActiveChats();
                    if (selectedContact) await fetchMessages(selectedContact.id);
                    setIsRefreshing(false);
                  }}
                  title="Segarkan data"
                  className="p-2 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <RefreshCwIcon spinning={isRefreshing} />
                </button>
              </div>
            </div>

            {/* Search Bar Input */}
            <div className="p-3 border-b border-slate-100 shrink-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Cari obrolan yang membalas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tab Segment Filter */}
            <div className="px-3 py-2 border-b border-slate-100 flex gap-1.5 overflow-x-auto text-xs shrink-0">
              {['all', 'Hot Lead', 'Pelanggan', 'Alumni Pelatihan'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilterTab(tab)}
                  className={
                    'px-3.5 py-1 rounded-full font-medium whitespace-nowrap transition ' +
                    (activeFilterTab === tab ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                  }
                >
                  {tab === 'all' ? 'Respon Pelanggan' : tab}
                </button>
              ))}
            </div>

            {/* Daftar Obrolan (Hanya Pelanggan yang Membalas) */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs md:text-sm">
                  <p>Belum ada pelanggan yang membalas.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pesan broadcast tidak mengotori inbox ini sampai pelanggan mengirimkan balasan.
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  const hasUnread = contact.unread_count > 0;
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={
                        'p-3.5 flex items-start gap-3 cursor-pointer transition active:bg-slate-100 ' +
                        (isSelected ? 'bg-emerald-50/80 md:border-l-4 md:border-emerald-500' : 'hover:bg-slate-50')
                      }
                    >
                      <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm relative">
                        {(contact.name || contact.phone_number || 'U')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className={'text-sm truncate ' + (hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800')}>
                            {contact.name || contact.phone_number}
                          </h2>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {contact.last_message_time
                              ? new Date(contact.last_message_time).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <p className={'text-xs truncate mt-0.5 ' + (hasUnread ? 'font-semibold text-slate-800' : 'text-slate-500')}>
                          {contact.last_message || `+${contact.phone_number}`}
                        </p>
                      </div>

                      {hasUnread && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Bottom Bar Navigasi */}
            <div className="md:hidden border-t border-slate-200 bg-white p-2 flex justify-around items-center shrink-0">
              <button
                onClick={() => setCurrentView('chat')}
                className={
                  'flex flex-col items-center gap-1 py-1 px-2 transition ' +
                  (currentView === 'chat' ? 'text-emerald-600 font-bold' : 'text-slate-600')
                }
              >
                <InboxIcon />
                <span className="text-[10px] font-medium">Obrolan</span>
              </button>
              <button
                onClick={() => setCurrentView('contacts')}
                className={
                  'flex flex-col items-center gap-1 py-1 px-2 transition ' +
                  (currentView === 'contacts' ? 'text-emerald-600 font-bold' : 'text-slate-600')
                }
              >
                <UserIcon />
                <span className="text-[10px] font-medium">Kontak</span>
              </button>
              <button
                onClick={() => setCurrentView('broadcast')}
                className={
                  'flex flex-col items-center gap-1 py-1 px-2 transition ' +
                  (currentView === 'broadcast' ? 'text-emerald-600 font-bold' : 'text-slate-600')
                }
              >
                <span className="text-sm leading-none">📢</span>
                <span className="text-[10px] font-medium">Broadcast</span>
              </button>
              <button
                onClick={() => setCurrentView('templates')}
                className={
                  'flex flex-col items-center gap-1 py-1 px-2 transition ' +
                  (currentView === 'templates' ? 'text-emerald-600 font-bold' : 'text-slate-600')
                }
              >
                <FileTextIcon />
                <span className="text-[10px] font-medium">Template</span>
              </button>
            </div>
          </div>

          {/* Kolom Percakapan Chat Kanan */}
          <div className={(selectedContact ? 'flex' : 'hidden md:flex') + ' flex-1 flex-col bg-slate-50 min-w-0 h-full relative'}>
            {selectedContact ? (
              <>
                {/* Chat Room Header */}
                <div className="h-14 sm:h-16 px-3 md:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-sm z-20">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <button
                      onClick={handleBackToContacts}
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

                  {/* Action Buttons Header */}
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <button
                      onClick={() => setCurrentView('templates')}
                      className="px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 font-medium transition"
                      title="Buka Dasbor Template Meta"
                    >
                      <FileTextIcon />
                      <span className="hidden sm:inline">Template</span>
                    </button>

                    <button
                      onClick={() => setShowBillingModal(true)}
                      className="px-2.5 py-1.5 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1 font-medium transition"
                      title="Cek Saldo Akun"
                    >
                      <CreditCardIcon />
                      <span className="hidden sm:inline">Saldo</span>
                    </button>

                    <button
                      onClick={() => setShowCrmPanel(!showCrmPanel)}
                      className={
                        'p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition ' +
                        (showCrmPanel ? 'bg-slate-100 text-emerald-600' : '')
                      }
                      title="Info Profil Pelanggan"
                    >
                      <UserIcon />
                    </button>
                  </div>
                </div>

                {/* Bubble Messages Flow */}
                <div ref={chatContainerRef} className="flex-1 p-3 md:p-6 overflow-y-auto space-y-3 md:space-y-4">
                  <div className="text-center my-1 md:my-2">
                    <span className="px-3 py-1 bg-white/90 border border-slate-200 rounded-full text-[10px] md:text-[11px] text-slate-500 shadow-sm">
                      Percakapan Terenkripsi • {activeChannel.name}
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div key={msg.id} className={'flex ' + (isOutbound ? 'justify-end' : 'justify-start')}>
                        <div
                          className={
                            'max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 py-2 md:px-4 md:py-2.5 shadow-sm text-xs md:text-sm relative leading-relaxed ' +
                            (isOutbound
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none')
                          }
                        >
                          <p className="whitespace-pre-line break-words">{msg.content}</p>
                          <div
                            className={
                              'flex items-center justify-end gap-1.5 mt-1 text-[9px] md:text-[10px] ' +
                              (isOutbound ? 'text-emerald-100' : 'text-slate-400')
                            }
                          >
                            <span>
                              {msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
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

                {/* Chat Input Area */}
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
                  Klik obrolan di samping atau gunakan menu navigasi di sidebar kiri untuk berpindah halaman.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* CRM Customer Profile Panel */}
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
                <h3 className="font-bold text-slate-800 text-sm">{selectedContact.name || selectedContact.phone_number}</h3>
                <p className="text-xs text-slate-400 mt-0.5">+{selectedContact.phone_number}</p>
              </div>

              {/* Tagging Pelanggan */}
              <div className="mt-5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <TagIcon /> Label Pelanggan
                </span>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(contactTags[selectedContact.id] || ['Hot Lead', 'Pelanggan']).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1 border border-emerald-200"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const cid = selectedContact.id;
                          setContactTags({
                            ...contactTags,
                            [cid]: (contactTags[cid] || []).filter((t) => t !== tag),
                          });
                        }}
                        className="hover:text-rose-600"
                      >
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
                        if (!newTagInput.trim()) return;
                        const cid = selectedContact.id;
                        const cur = contactTags[cid] || ['Pelanggan'];
                        if (!cur.includes(newTagInput.trim())) {
                          setContactTags({
                            ...contactTags,
                            [cid]: [...cur, newTagInput.trim()],
                          });
                        }
                        setNewTagInput('');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => {
                      if (!newTagInput.trim()) return;
                      const cid = selectedContact.id;
                      const cur = contactTags[cid] || ['Pelanggan'];
                      if (!cur.includes(newTagInput.trim())) {
                        setContactTags({
                          ...contactTags,
                          [cid]: [...cur, newTagInput.trim()],
                        });
                      }
                      setNewTagInput('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Customer Stats Info */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Total Pesan:</span>
                  <span className="font-semibold text-slate-700">{messages.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Nomor Pengirim:</span>
                  <span className="font-semibold text-emerald-600">{activeChannel.number}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowCrmPanel(false);
                  setShowBillingModal(true);
                }}
                className="w-full py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-xl text-xs border border-emerald-200 flex items-center justify-center gap-2 transition"
              >
                <CreditCardIcon /> Cek Saldo & Kuota Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buku Kontak Legacy */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        contacts={contacts}
        onSelectContact={(c) => {
          handleSelectContact(c);
        }}
        onContactCreated={(newC) => {
          setContacts((prev) => [newC, ...prev]);
          showNotice('Kontak baru berhasil disimpan ke Supabase!', 'success');
        }}
        supabaseUrl={DEFAULT_SUPABASE_URL}
        supabaseKey={DEFAULT_SUPABASE_ANON_KEY}
      />

      {/* Modal Template Meta Legacy */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplateForChat={(tmplBody) => {
          setInputText(tmplBody);
        }}
      />

      {/* Modal Billing & Saldo */}
      <BillingModal isOpen={showBillingModal} onClose={() => setShowBillingModal(false)} />
    </div>
  );
}