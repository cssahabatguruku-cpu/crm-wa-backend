import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone_number, message_text, contact_id, phone_number_id, access_token } = req.body || {};

  if (!phone_number || !message_text || !contact_id) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Diperlukan: phone_number, message_text, dan contact_id' 
    });
  }

  // --- FILTER & SANITASI DARI TEKS PLACEHOLDER / DATA KOTOR DATABASE ---

  // 1. Validasi Phone Number ID: Wajib berupa ANGKA murni.
  // Jika berisi teks placeholder ("ISIKAN_..."), otomatis fallback ke WA_PHONE_NUMBER_ID Vercel.
  const rawPhoneId = String(phone_number_id || '').trim();
  const isValidPhoneId = /^\d+$/.test(rawPhoneId);
  const activePhoneNumberId = isValidPhoneId ? rawPhoneId : process.env.WA_PHONE_NUMBER_ID;

  // 2. Validasi Access Token: Wajib berawalan "EAA" dan tidak berisi teks "ISIKAN".
  // Jika tidak valid, otomatis fallback ke WA_PERMANENT_TOKEN Vercel.
  const rawToken = String(access_token || '').trim();
  const isValidToken = rawToken.startsWith('EAA') && !rawToken.includes('ISIKAN');
  const activeAccessToken = isValidToken ? rawToken : process.env.WA_PERMANENT_TOKEN;

  if (!activePhoneNumberId || !activeAccessToken) {
    return res.status(400).json({
      error: 'Kredensial Phone Number ID atau Access Token tidak valid. Periksa menu Pengaturan CRM.'
    });
  }

  const cleanPhone = String(phone_number).replace(/[^0-9]/g, '');

  try {
    const metaUrl = `https://graph.facebook.com/v20.0/${activePhoneNumberId}/messages`;
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeAccessToken}`,
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
      return res.status(metaResponse.status).json({
        error: metaData.error?.message || 'Gagal mengirim pesan via Meta Cloud API',
        details: metaData.error
      });
    }

    const waMessageId = metaData.messages?.[0]?.id;

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
      return res.status(200).json({
        status: 'partial_success',
        message: 'Pesan terkirim ke WA tetapi gagal dicatat di database Supabase.',
        error: dbError.message
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pesan terkirim via nomor aktif!',
      data: dbData
    });

  } catch (error) {
    console.error('Error pengiriman pesan:', error.message);
    return res.status(500).json({ error: error.message });
  }
}