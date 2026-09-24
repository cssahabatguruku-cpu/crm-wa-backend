import React, { useState, useEffect, useCallback } from 'react';

const META_WABA_ID = '163200896887310';
const META_GRAPH_VERSION = 'v20.0';
const META_ACCESS_TOKEN =
  'EAAZBLhjrRT18BSoHItgxuRkvZAVg9XXylyw0BZBQcdWBuZCJlOfuHoo69lbVjh5TKiNZA62dSMl411wSggNytzpWwcM0oCjXc410AZBhsKRowuyqnZBWT6vcncEBwgDgZAgF7sriDJocBiBH5VAlKqkA3gtkNGnLCdzN4vyjgvhPrSGIdcwJXTCGZCd1hFMOR8JFJIAZDZD';

export default function BillingModal({ isOpen, onClose }) {
  const [wabaInfo, setWabaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Status Akun & Tier Limit Riil dari Meta
  const fetchWabaBillingDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_WABA_ID}?fields=id,name,currency,account_review_status,health_status,messaging_limit_tier&access_token=${META_ACCESS_TOKEN}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      setWabaInfo(data);
    } catch (err) {
      console.error('Gagal mengambil data penagihan Meta:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWabaBillingDetails();
    }
  }, [isOpen, fetchWabaBillingDetails]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
          <div>
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              💳 Tagihan & Kuota Meta WABA Direct
            </h2>
            <p className="text-xs text-slate-500">
              Integrasi Penagihan Resmi WhatsApp Business Cloud API
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Live Account Status Banner */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl mb-5 shadow-inner">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                Akun Terhubung
              </span>
              <h3 className="text-lg font-extrabold font-mono">
                {wabaInfo?.name || 'Sahabat Guru (v)'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ID: {META_WABA_ID}
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-full">
              {wabaInfo?.account_review_status || 'VERIFIED'}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">
                SISTEM PEMBAYARAN:
              </span>
              <span className="font-semibold text-emerald-300">
                Postpaid / Auto-Debit Card
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">
                MATA UANG METODE:
              </span>
              <span className="font-semibold text-white">
                {wabaInfo?.currency || 'IDR / USD'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Tier Limit */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">
              Status Batas Pesan 24 Jam (Tier Meta):
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
              {wabaInfo?.messaging_limit_tier || 'Tier 2 (10.000 penerima/24 jam)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Kapasitas nomor otomatis naik ke Tier berikutnya (100K/hari) secara gratis jika kualitas pesan dijaga tetap tinggi oleh sistem.
          </p>
        </div>

        {/* Official Meta Indonesia Rates */}
        <div className="mb-6">
          <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider mb-2">
            Tabel Tarif Resmi Meta (Wilayah Indonesia):
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b">
                  <th className="p-2.5">Kategori Pesan</th>
                  <th className="p-2.5">Tarif / Percakapan</th>
                  <th className="p-2.5">Fungsi Penggunaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2.5 font-bold text-emerald-600">MARKETING</td>
                  <td className="p-2.5 font-mono">~Rp 465</td>
                  <td className="p-2.5 text-slate-500">Promo, tawaran, pengumuman broadcast</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-cyan-600">UTILITY</td>
                  <td className="p-2.5 font-mono">~Rp 235</td>
                  <td className="p-2.5 text-slate-500">Resi pengiriman, bukti bayar, konfirmasi</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-700">SERVICE (Balasan CS)</td>
                  <td className="p-2.5 font-bold text-emerald-600">GRATIS</td>
                  <td className="p-2.5 text-slate-500">Balasan CS dalam jendela 24 jam pelanggan</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Direct Button to Meta Billing */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h5 className="font-bold text-amber-900 text-xs">
              Kelola Metode Pembayaran & Faktur Meta
            </h5>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Tambah kartu kredit/debit atau unduh kuitansi resmi dari Meta Business Suite.
            </p>
          </div>
          <a
            href="https://business.facebook.com/billing_hub"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold whitespace-nowrap shadow transition"
          >
            Buka Meta Payment ↗
          </a>
        </div>

        <div className="flex justify-end pt-5 mt-5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}