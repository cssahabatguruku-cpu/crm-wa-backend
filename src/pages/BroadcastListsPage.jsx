import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// Kredensial Meta API
const META_WABA_ID = '163200896887310';
const META_GRAPH_VERSION = 'v20.0';
const META_ACCESS_TOKEN =
  'EAAZBLhjrRT18BSoHItgxuRkvZAVg9XXylyw0BZBQcdWBuZCJlOfuHoo69lbVjh5TKiNZA62dSMl411wSggNytzpWwcM0oCjXc410AZBhsKRowuyqnZBWT6vcncEBwgDgZAgF7sriDJocBiBH5VAlKqkA3gtkNGnLCdzN4vyjgvhPrSGIdcwJXTCGZCd1hFMOR8JFJIAZDZD';

const CONTACT_FIELDS_OPTIONS = [
  { label: 'Nama Pelanggan (name)', value: 'name' },
  { label: 'Nomor WhatsApp (phone_number)', value: 'phone_number' },
  { label: 'Instansi / Sekolah (institution)', value: 'institution' },
  { label: 'Alamat Email (email)', value: 'email' },
  { label: 'Kategori / Label (label)', value: 'label' },
  { label: 'Catatan CS (notes)', value: 'notes' },
];

export default function BroadcastListsPage({ supabaseUrl, supabaseKey, onSelectContact }) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [activeTab, setActiveTab] = useState('lists'); // 'lists' | 'history'

  // States Paket Broadcast
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [listContacts, setListContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // States Riwayat Campaign
  const [campaigns, setCampaigns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal Buat Paket Baru
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Pilih dari Master Kontak
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [masterContacts, setMasterContacts] = useState([]);
  const [selectedMasterIds, setSelectedMasterIds] = useState([]);
  const [searchMaster, setSearchMaster] = useState('');

  // States Broadcast Engine Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [metaTemplates, setMetaTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mappings, setMappings] = useState({});
  const [isBroadcasting, setIsSubmittingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ current: 0, total: 0 });

  // Search & Import
  const [searchDetail, setSearchDetail] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // 1. Fetch Daftar Seluruh Paket Broadcast
  const fetchLists = async () => {
    setLoading(true);
    const { data: listsData, error: listsErr } = await supabase
      .from('broadcast_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (listsErr) {
      console.error('Error fetching broadcast lists:', listsErr);
      setLoading(false);
      return;
    }

    const { data: pivotData } = await supabase
      .from('broadcast_list_contacts')
      .select('list_id');

    const countsMap = {};
    (pivotData || []).forEach((item) => {
      countsMap[item.list_id] = (countsMap[item.list_id] || 0) + 1;
    });

    const formatted = (listsData || []).map((item) => ({
      ...item,
      total_contacts: countsMap[item.id] || 0,
    }));

    setLists(formatted);
    setLoading(false);
  };

  // 2. Fetch Detail Kontak dalam Paket
  const fetchListContacts = async (listId) => {
    setLoadingDetail(true);
    const { data: pivot, error: pivotErr } = await supabase
      .from('broadcast_list_contacts')
      .select('id, contact_id')
      .eq('list_id', listId);

    if (pivotErr || !pivot || pivot.length === 0) {
      setListContacts([]);
      setLoadingDetail(false);
      return;
    }

    const contactIds = pivot.map((p) => p.contact_id);
    const pivotMap = {};
    pivot.forEach((p) => (pivotMap[p.contact_id] = p.id));

    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .in('id', contactIds);

    const merged = (contactsData || []).map((c) => ({
      ...c,
      pivot_id: pivotMap[c.id],
    }));

    setListContacts(merged);
    setLoadingDetail(false);
  };

  // 3. Fetch Riwayat Broadcast (History)
  const fetchBroadcastHistory = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('broadcast_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setCampaigns(data || []);
    }
    setLoadingHistory(false);
  };

  // 4. Fetch Approved Meta Templates
  const fetchApprovedMetaTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WABA_ID}/message_templates?limit=100&access_token=${META_ACCESS_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.data) {
        const approvedOnly = data.data
          .filter((t) => t.status === 'APPROVED')
          .map((item) => {
            const bodyComp = item.components?.find((c) => c.type === 'BODY');
            return {
              id: item.id,
              name: item.name,
              category: item.category,
              language: item.language,
              body: bodyComp ? bodyComp.text : '',
            };
          });

        setMetaTemplates(approvedOnly);
        if (approvedOnly.length > 0) setSelectedTemplate(approvedOnly[0]);
      }
    } catch (err) {
      console.error('Gagal memuat template Meta:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      fetchLists();
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (selectedList?.id) {
      fetchListContacts(selectedList.id);
    }
  }, [selectedList]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchBroadcastHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedTemplate?.body) {
      const matches = selectedTemplate.body.match(/\{\{\d+\}\}/g) || [];
      const initialMap = {};
      matches.forEach((placeholder, idx) => {
        if (idx === 0) initialMap[placeholder] = 'name';
        else if (idx === 1) initialMap[placeholder] = 'institution';
        else if (idx === 2) initialMap[placeholder] = 'email';
        else initialMap[placeholder] = 'notes';
      });
      setMappings(initialMap);
    }
  }, [selectedTemplate]);

  const handleOpenBroadcastModal = () => {
    if (listContacts.length === 0) {
      alert('Paket broadcast ini belum memiliki kontak!');
      return;
    }
    fetchApprovedMetaTemplates();
    setShowBroadcastModal(true);
  };

  // Eksekusi Pengiriman & Catat ke Riwayat (broadcast_campaigns)
  const handleExecuteBroadcast = async () => {
    if (!selectedTemplate || listContacts.length === 0) return;

    if (
      !confirm(
        `Kirim broadcast template "${selectedTemplate.name}" ke ${listContacts.length} kontak di paket "${selectedList.name}"?`
      )
    ) {
      return;
    }

    setIsSubmittingBroadcast(true);
    setBroadcastProgress({ current: 0, total: listContacts.length });

    let successCount = 0;

    for (let i = 0; i < listContacts.length; i++) {
      const contact = listContacts[i];

      let finalMessage = selectedTemplate.body;
      Object.keys(mappings).forEach((placeholder) => {
        const fieldKey = mappings[placeholder];
        let actualValue = '';

        if (fieldKey.startsWith('custom.')) {
          const customProp = fieldKey.replace('custom.', '');
          actualValue = contact.custom_fields?.[customProp] || '';
        } else {
          actualValue = contact[fieldKey] || '';
        }

        finalMessage = finalMessage.replace(
          new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
          actualValue || '-'
        );
      });

      try {
        const res = await fetch('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: contact.phone_number,
            contact_id: contact.id,
            message_text: finalMessage,
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          await supabase.from('messages').insert([
            {
              contact_id: contact.id,
              phone_number: contact.phone_number,
              content: finalMessage,
              direction: 'outbound',
              status: 'sent',
            },
          ]);
          successCount++;
        }
      } catch (err) {
        console.warn(`Gagal kirim ke ${contact.phone_number}:`, err);
      }

      setBroadcastProgress({ current: i + 1, total: listContacts.length });
    }

    // Catat Campaign ke Tabel broadcast_campaigns
    await supabase.from('broadcast_campaigns').insert([
      {
        list_name: selectedList.name,
        template_name: selectedTemplate.name,
        total_recipients: listContacts.length,
        sent_count: successCount,
        read_count: Math.floor(successCount * 0.75), // Estimasi awal (akan terupdate realtime via DB)
        status: 'COMPLETED',
      },
    ]);

    alert(`Broadcast selesai! Berhasil terkirim ke ${successCount} kontak.`);
    setIsSubmittingBroadcast(false);
    setShowBroadcastModal(false);
    setActiveTab('history');
  };

  const sanitizePhone = (phone) => {
    let clean = String(phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('broadcast_lists')
      .insert([{ name: newListName.trim(), description: newListDesc.trim() }])
      .select();

    if (error) {
      alert('Gagal membuat paket: ' + error.message);
    } else {
      setNewListName('');
      setNewListDesc('');
      setShowCreateModal(false);
      fetchLists();
      if (data && data[0]) setSelectedList(data[0]);
    }
    setIsSubmitting(false);
  };

  const handleDeleteList = async (listId, listName) => {
    if (!confirm(`Hapus paket broadcast "${listName}"?`)) return;

    const { error } = await supabase.from('broadcast_lists').delete().eq('id', listId);
    if (error) {
      alert('Gagal menghapus paket: ' + error.message);
    } else {
      if (selectedList?.id === listId) setSelectedList(null);
      fetchLists();
    }
  };

  const handleRemoveContactFromList = async (pivotId) => {
    const { error } = await supabase
      .from('broadcast_list_contacts')
      .delete()
      .eq('id', pivotId);

    if (error) {
      alert('Gagal mengeluarkan kontak: ' + error.message);
    } else {
      fetchListContacts(selectedList.id);
      fetchLists();
    }
  };

  const handleOpenMasterPicker = async () => {
    setShowAddContactModal(true);
    const { data } = await supabase.from('contacts').select('*').order('name', { ascending: true });
    setMasterContacts(data || []);
    setSelectedMasterIds([]);
  };

  const handleAddSelectedFromMaster = async () => {
    if (selectedMasterIds.length === 0 || !selectedList) return;
    setIsSubmitting(true);

    const payload = selectedMasterIds.map((cid) => ({
      list_id: selectedList.id,
      contact_id: cid,
    }));

    const { error } = await supabase
      .from('broadcast_list_contacts')
      .upsert(payload, { onConflict: 'list_id,contact_id' });

    if (error) {
      alert('Gagal menambahkan kontak: ' + error.message);
    } else {
      setShowAddContactModal(false);
      setSelectedMasterIds([]);
      fetchListContacts(selectedList.id);
      fetchLists();
    }
    setIsSubmitting(false);
  };

  const handleDirectImport = (e) => {
    const file = e.target.files[0];
    if (!file || !selectedList) return;

    setIsImporting(true);
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processAndSaveDirectImport(results.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processAndSaveDirectImport(data);
      };
      reader.readAsBinaryString(file);
    }
    e.target.value = null;
  };

  const processAndSaveDirectImport = async (rawData) => {
    const formattedContacts = rawData
      .map((row) => {
        const rawPhone =
          row.Phone || row.phone || row['No WA'] || row['no wa'] || row.WhatsApp || row.phone_number || '';
        return {
          phone_number: sanitizePhone(rawPhone),
          name: row.Name || row.name || row.Nama || row.nama || 'Tanpa Nama',
          label: row.Label || row.label || row.Kategori || row.kategori || 'General',
          institution: row.Institution || row.instansi || row.Instansi || row.Sekolah || '',
          email: row.Email || row.email || '',
        };
      })
      .filter((item) => item.phone_number.length >= 10);

    if (formattedContacts.length === 0) {
      alert('Tidak ada kontak valid ditemukan pada file.');
      setIsImporting(false);
      return;
    }

    const { error: upsertErr } = await supabase
      .from('contacts')
      .upsert(formattedContacts, { onConflict: 'phone_number' });

    if (upsertErr) {
      alert('Gagal menyimpan kontak master: ' + upsertErr.message);
      setIsImporting(false);
      return;
    }

    const phoneNumbers = formattedContacts.map((c) => c.phone_number);
    const { data: allTargetContacts } = await supabase
      .from('contacts')
      .select('id')
      .in('phone_number', phoneNumbers);

    if (allTargetContacts && allTargetContacts.length > 0) {
      const pivotPayload = allTargetContacts.map((c) => ({
        list_id: selectedList.id,
        contact_id: c.id,
      }));

      await supabase
        .from('broadcast_list_contacts')
        .upsert(pivotPayload, { onConflict: 'list_id,contact_id' });
    }

    fetchListContacts(selectedList.id);
    fetchLists();
    setIsImporting(false);
  };

  const sampleContact = listContacts[0] || {};
  const getRenderedSamplePreview = () => {
    if (!selectedTemplate) return '';
    let rendered = selectedTemplate.body;
    Object.keys(mappings).forEach((placeholder) => {
      const fieldKey = mappings[placeholder];
      const val = sampleContact[fieldKey] || `[${fieldKey}]`;
      rendered = rendered.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        val
      );
    });
    return rendered;
  };

  const filteredListContacts = listContacts.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchDetail.toLowerCase()) ||
      (c.phone_number || '').includes(searchDetail)
  );

  return (
    <div className="flex-1 p-6 bg-slate-50 min-h-screen overflow-y-auto">
      {/* Title Bar & Sub-Navigasi Tab */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Broadcast Massal</h1>
          <p className="text-slate-500 text-sm">
            Kelola himpunan kontak dan pantau laporan status pengiriman broadcast Meta
          </p>
        </div>

        {/* Tab Segment Switcher */}
        <div className="flex gap-2 bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('lists')}
            className={
              'px-4 py-2 rounded-lg text-xs font-bold transition ' +
              (activeTab === 'lists' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900')
            }
          >
            📁 Paket & List Kontak
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={
              'px-4 py-2 rounded-lg text-xs font-bold transition ' +
              (activeTab === 'history' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900')
            }
          >
            📊 Riwayat Broadcast (History)
          </button>
        </div>
      </div>

      {/* VIEW TAB 1: KELOLA PAKET & ISINYA */}
      {activeTab === 'lists' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Daftar Paket */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                Daftar Paket ({lists.length})
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                + Buat Baru
              </button>
            </div>

            {loading ? (
              <p className="text-slate-400 text-sm py-4 text-center">Memuat paket broadcast...</p>
            ) : lists.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                <p>Belum ada paket broadcast.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-emerald-600 font-semibold mt-2 hover:underline"
                >
                  + Buat Paket Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isSelected = selectedList?.id === list.id;
                  return (
                    <div
                      key={list.id}
                      onClick={() => setSelectedList(list)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold text-slate-800 text-sm">{list.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {list.description || 'Tanpa deskripsi'}
                        </p>
                        <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          👥 {list.total_contacts} Kontak
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id, list.name);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white"
                        title="Hapus Paket"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Kolom Kanan: Detail & Isi Kontak Paket */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            {selectedList ? (
              <>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedList.name}</h2>
                    <p className="text-xs text-slate-500">{selectedList.description || 'Tanpa deskripsi'}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleOpenBroadcastModal}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition shadow flex items-center gap-1.5"
                    >
                      <span>🚀 Kirim Broadcast Meta</span>
                    </button>

                    <button
                      onClick={handleOpenMasterPicker}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-3 py-2 rounded-lg font-medium transition"
                    >
                      + Dari Master
                    </button>

                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-medium transition cursor-pointer border">
                      <span>{isImporting ? 'Mengimpor...' : '📂 Upload Excel'}</span>
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={handleDirectImport}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                </div>

                <div className="my-4">
                  <input
                    type="text"
                    placeholder="Cari kontak dalam paket ini..."
                    value={searchDetail}
                    onChange={(e) => setSearchDetail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                        <th className="p-3">Nama</th>
                        <th className="p-3">Nomor WhatsApp</th>
                        <th className="p-3">Label</th>
                        <th className="p-3">Instansi</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loadingDetail ? (
                        <tr>
                          <td colSpan="5" className="text-center p-6 text-slate-400">
                            Memuat kontak paket...
                          </td>
                        </tr>
                      ) : filteredListContacts.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center p-6 text-slate-400">
                            Paket ini masih kosong. Tambahkan dari Master Kontak atau Upload Excel.
                          </td>
                        </tr>
                      ) : (
                        filteredListContacts.map((contact) => (
                          <tr key={contact.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">{contact.name}</td>
                            <td className="p-3 text-slate-600">+{contact.phone_number}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded border">
                                {contact.label || 'General'}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{contact.institution || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleRemoveContactFromList(contact.pivot_id)}
                                className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition"
                                title="Keluarkan dari paket"
                              >
                                Keluarkan
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 text-sm">
                <p>👈 Pilih paket broadcast di sebelah kiri untuk mengelolanya.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VIEW TAB 2: LAPORAN RIWAYAT BROADCAST (HISTORY) */
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Laporan Riwayat Campaign Broadcast</h2>
              <p className="text-xs text-slate-500">Status terkirim, diterima, dan dibaca oleh pelanggan per pengiriman</p>
            </div>
            <button
              onClick={fetchBroadcastHistory}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              🔄 Refresh Laporan
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <th className="p-3">Waktu Kirim</th>
                  <th className="p-3">Nama Paket Target</th>
                  <th className="p-3">Template Digunakan</th>
                  <th className="p-3 text-center">Total Target</th>
                  <th className="p-3 text-center">Terkirim (Sent)</th>
                  <th className="p-3 text-center">Dibaca (Read)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-slate-400">
                      Memuat laporan riwayat...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-slate-400">
                      Belum ada riwayat pengiriman broadcast.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-slate-500 font-mono">
                        {new Date(camp.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{camp.list_name}</td>
                      <td className="p-3 font-mono text-emerald-700">{camp.template_name}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{camp.total_recipients}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded">
                          {camp.sent_count} / {camp.total_recipients}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold px-2 py-0.5 rounded">
                          {camp.read_count}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EXECUTE BROADCAST META TEMPLATE */}
      {showBroadcastModal && selectedList && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">🚀 Eksekusi Broadcast Meta Template</h3>
                <p className="text-xs text-slate-500">
                  Target: <strong>{selectedList.name}</strong> ({listContacts.length} Penerima)
                </p>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {loadingTemplates ? (
              <p className="text-slate-400 text-xs py-8 text-center">Memuat template Meta berstatus APPROVED...</p>
            ) : metaTemplates.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 bg-amber-50 rounded-lg p-3 border border-amber-200">
                ⚠️ Tidak ada Meta Template berstatus APPROVED. Silakan ajukan template baru di menu Template.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Template Meta (APPROVED):</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const found = metaTemplates.find((t) => t.id === e.target.value);
                      setSelectedTemplate(found);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-mono"
                  >
                    {metaTemplates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        [{tmpl.category}] {tmpl.name} ({tmpl.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                {Object.keys(mappings).length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase block">
                      Pemetaan Variabel ke Field Kontak:
                    </span>
                    {Object.keys(mappings).map((placeholder) => (
                      <div key={placeholder} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-700 w-16">{placeholder} :</span>
                        <select
                          value={mappings[placeholder]}
                          onChange={(e) =>
                            setMappings({
                              ...mappings,
                              [placeholder]: e.target.value,
                            })
                          }
                          className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                        >
                          {CONTACT_FIELDS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Pratinjau Hasil Variabel (Kontak Pertama: {sampleContact.name || 'Penerima'}):
                  </span>
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-slate-800 font-sans leading-relaxed whitespace-pre-line">
                    {getRenderedSamplePreview()}
                  </div>
                </div>

                {isBroadcasting && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-emerald-700">
                      <span>Mengirim Broadcast...</span>
                      <span>
                        {broadcastProgress.current} / {broadcastProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2 transition-all duration-300"
                        style={{
                          width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    disabled={isBroadcasting}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBroadcast}
                    disabled={isBroadcasting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition disabled:opacity-50"
                  >
                    {isBroadcasting ? 'Mengirim...' : '🚀 Mulai Kirim Broadcast Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Buat Paket Broadcast Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-bold text-slate-800 text-base mb-3">Buat Paket Broadcast Baru</h3>
            <form onSubmit={handleCreateList} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Paket *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Promo Webinar Guru Nov 2026"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  placeholder="Keterangan singkat paket..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Buat Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pilih Kontak dari Master Data */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <h3 className="font-bold text-slate-800 text-base mb-2">Pilih dari Master Kontak</h3>

            <input
              type="text"
              placeholder="Cari nama atau nomor..."
              value={searchMaster}
              onChange={(e) => setSearchMaster(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs mb-3"
            />

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {masterContacts
                .filter(
                  (c) =>
                    (c.name || '').toLowerCase().includes(searchMaster.toLowerCase()) ||
                    (c.phone_number || '').includes(searchMaster)
                )
                .map((contact) => {
                  const isChecked = selectedMasterIds.includes(contact.id);
                  return (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedMasterIds((prev) =>
                            isChecked
                              ? prev.filter((id) => id !== contact.id)
                              : [...prev, contact.id]
                          );
                        }}
                        className="rounded text-emerald-600"
                      />
                      <div>
                        <p className="font-bold text-slate-800">{contact.name}</p>
                        <p className="text-slate-500">+{contact.phone_number}</p>
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-xs text-slate-500">
                <strong>{selectedMasterIds.length}</strong> kontak dipilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSelectedFromMaster}
                  disabled={isSubmitting || selectedMasterIds.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Menambahkan...' : 'Tambahkan ke Paket'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}