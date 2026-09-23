import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import CrmDrawer from './components/CrmDrawer';
import BroadcastModal from './components/modals/BroadcastModal';
import { InboxIcon, FileTextIcon, CreditCardIcon, MegaphoneIcon, SettingsIcon, XIcon } from './components/Icons';

const DEFAULT_SUPABASE_URL = 'https://axveczjyamcljxqfnssv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dmVjemp5YW1jbGp4cWZuc3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzA2NjYsImV4cCI6MjEwNTcwNjY2Nn0.CDW9IxJPQeIWNEoqUv5cM3Uqlr0k9GYVaBOzLtt9G0Q';
const DEFAULT_API_URL = '/api/send-message';

export default function App() {
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
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showCrmPanel, setShowCrmPanel] = useState(false);

  const showNotice = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'chat', contactId: contact.id }, '');
    }
  };

  const handleBackToContacts = () => {
    if (typeof window !== 'undefined' && window.history.state?.page === 'chat') {
      window.history.back();
    } else {
      setSelectedContact(null);
    }
  };

  // Popstate history listener
  useEffect(() => {
    const handlePopState = () => {
      if (showTemplateModal) return setShowTemplateModal(false);
      if (showInvoiceModal) return setShowInvoiceModal(false);
      if (showBroadcastModal) return setShowBroadcastModal(false);
      if (showSettingsModal) return setShowSettingsModal(false);
      if (showCrmPanel) return setShowCrmPanel(false);
      setSelectedContact(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showTemplateModal, showInvoiceModal, showBroadcastModal, showSettingsModal, showCrmPanel]);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/contacts?select=*&order=created_at.desc`, {
        headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      setContacts(data || []);
      if (typeof window !== 'undefined' && window.innerWidth >= 768 && data?.length > 0 && !selectedContact) {
        setSelectedContact(data[0]);
      }
    } catch (err) {
      console.warn('Gagal memuat kontak:', err.message);
    }
  }, [selectedContact]);

  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const res = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/messages?contact_id=eq.${contactId}&order=created_at.asc`, {
        headers: { apikey: DEFAULT_SUPABASE_ANON_KEY, Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}` }
      });
      const data = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.warn('Gagal memuat pesan:', err.message);
    }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  useEffect(() => {
    if (selectedContact?.id) fetchMessages(selectedContact.id);
  }, [selectedContact, fetchMessages]);

  // Polling berkala pesan
  useEffect(() => {
    const timer = setInterval(() => {
      if (selectedContact?.id) fetchMessages(selectedContact.id);
    }, 3500);
    return () => clearInterval(timer);
  }, [selectedContact, fetchMessages]);

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content || !selectedContact) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, content, direction: 'outbound', status: 'sending', created_at: new Date().toISOString() }]);
    setInputText('');

    try {
      const response = await fetch(DEFAULT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: selectedContact.phone_number, contact_id: selectedContact.id, message_text: content })
      });
      if (!response.ok) throw new Error('Gagal mengirim via API');
      showNotice('Pesan WhatsApp terkirim!', 'success');
      fetchMessages(selectedContact.id);
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBroadcast = async (text, segment) => {
    const targets = contacts.filter((c) => {
      if (segment === 'all') return true;
      const tags = contactTags[c.id] || ['Hot Lead'];
      return tags.includes(segment);
    });

    showNotice(`Memulai siaran ke ${targets.length} penerima...`, 'info');
    for (const target of targets) {
      try {
        await fetch(DEFAULT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: target.phone_number, contact_id: target.id, message_text: text })
        });
      } catch (e) {
        console.error('Gagal kirim ke:', target.phone_number);
      }
    }
    showNotice('Seluruh pesan broadcast telah selesai diproses!', 'success');
    if (selectedContact) fetchMessages(selectedContact.id);
  };

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-slate-100 text-slate-800 font-sans antialiased overflow-hidden flex">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-rose-600 text-white' : notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2"><XIcon /></button>
        </div>
      )}

      {/* Mini Desktop Sidebar */}
      <div className="hidden md:flex w-16 bg-slate-900 flex-col items-center py-4 justify-between border-r border-slate-800 shrink-0">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">WA</div>
          <button title="Kotak Masuk" className="p-3 text-emerald-400 bg-slate-800 rounded-xl"><InboxIcon /></button>
          <button title="Kirim Siaran (Broadcast)" onClick={() => setShowBroadcastModal(true)} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><MegaphoneIcon /></button>
          <button title="Template Balasan" onClick={() => setShowTemplateModal(true)} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><FileTextIcon /></button>
          <button title="Kirim Tagihan" onClick={() => setShowInvoiceModal(true)} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><CreditCardIcon /></button>
        </div>
        <button title="Pengaturan" onClick={() => setShowSettingsModal(true)} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"><SettingsIcon /></button>
      </div>

      {/* Komponen Kontak */}
      <Sidebar
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={handleSelectContact}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeFilterTab={activeFilterTab}
        setActiveFilterTab={setActiveFilterTab}
        contactTags={contactTags}
        isRefreshing={isRefreshing}
        onRefresh={async () => {
          setIsRefreshing(true);
          await fetchContacts();
          if (selectedContact) await fetchMessages(selectedContact.id);
          setIsRefreshing(false);
        }}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenTemplates={() => setShowTemplateModal(true)}
        onOpenInvoice={() => setShowInvoiceModal(true)}
        onOpenBroadcast={() => setShowBroadcastModal(true)}
      />

      {/* Komponen Ruang Obrolan */}
      <ChatArea
        selectedContact={selectedContact}
        messages={messages}
        inputText={inputText}
        setInputText={setInputText}
        isSending={isSending}
        onSendMessage={handleSendMessage}
        onBackToContacts={handleBackToContacts}
        onToggleCrm={() => setShowCrmPanel(!showCrmPanel)}
        showCrmPanel={showCrmPanel}
        onOpenTemplates={() => setShowTemplateModal(true)}
        onOpenInvoice={() => setShowInvoiceModal(true)}
      />

      {/* Komponen Laci CRM */}
      <CrmDrawer
        isOpen={showCrmPanel}
        onClose={() => setShowCrmPanel(false)}
        selectedContact={selectedContact}
        contactTags={contactTags}
        newTagInput={newTagInput}
        setNewTagInput={setNewTagInput}
        onAddTag={(tag) => {
          if (!selectedContact || !tag.trim()) return;
          const cid = selectedContact.id;
          const current = contactTags[cid] || ['Pelanggan'];
          if (!current.includes(tag.trim())) setContactTags({ ...contactTags, [cid]: [...current, tag.trim()] });
          setNewTagInput('');
        }}
        onRemoveTag={(tag) => {
          if (!selectedContact) return;
          const cid = selectedContact.id;
          setContactTags({ ...contactTags, [cid]: (contactTags[cid] || []).filter((t) => t !== tag) });
        }}
        totalMessages={messages.length}
        onOpenInvoice={() => setShowInvoiceModal(true)}
      />

      {/* Modal Broadcast */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        contacts={contacts}
        onSendBroadcast={handleSendBroadcast}
      />
    </div>
  );
}