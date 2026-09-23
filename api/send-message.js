import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase menggunakan Service Role Key agar dapat menulis ke tabel pesan
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. Mengatur header CORS agar browser mengizinkan komunikasi lintas domain
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); // Mengizinkan akses dari dashboard web manapun
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // 2. Menangani preflight request (OPTIONS) dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Memastikan metode HTTP utama adalah POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone_number, message_text, contact_id } = req.body || {};

  // Validasi kelengkapan data sebelum diproses
  if (!phone_number || !message_text || !contact_id) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Diperlukan: phone_number, message_text, dan contact_id' 
    });
  }

  // Bersihkan format nomor HP (hanya angka)
  const cleanPhone = String(phone_number).replace(/[^0-9]/g, '');

  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_PERMANENT_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return res.status(500).json({
      error: 'Environment variables WA_PHONE_NUMBER_ID atau WA_PERMANENT_TOKEN belum diatur di Vercel.'
    });
  }

  try {
    // Kirim pesan teks ke WhatsApp Cloud API Meta
    const metaUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { body: message_text },
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      throw new Error(metaData.error?.message || 'Gagal mengirim pesan via WhatsApp Cloud API');
    }

    const waMessageId = metaData.messages?.[0]?.id;

    // Catat riwayat pesan keluar (outbound) ke tabel messages Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('messages')
      .insert({
        wa_message_id: waMessageId,
        contact_id: contact_id,
        content: message_text,
        type: 'text',
        direction: 'outbound',
        status: 'sent'
      })
      .select()
      .single();

    if (dbError) {
      console.warn('Gagal menyimpan pesan ke Supabase:', dbError.message);
      // Pesan tetap sukses terkirim ke WhatsApp, beri info ke client
      return res.status(200).json({
        status: 'partial_success',
        message: 'Pesan terkirim ke WhatsApp tetapi gagal tercatat di database.',
        error: dbError.message
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pesan berhasil terkirim ke WhatsApp dan tersimpan di database.',
      data: dbData
    });

  } catch (error) {
    console.error('Error pengiriman pesan:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
