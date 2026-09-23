import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone_number, message_text, contact_id } = req.body;

  if (!phone_number || !message_text || !contact_id) {
    return res.status(400).json({ 
      error: 'Data tidak lengkap. Diperlukan: phone_number, message_text, dan contact_id' 
    });
  }

  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_PERMANENT_TOKEN;

  try {
    // 1. Kirim pesan via Meta Graph API
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
        to: phone_number,
        type: 'text',
        text: { body: message_text },
      }),
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      throw new Error(metaData.error?.message || 'Gagal mengirim pesan via Meta API');
    }

    const waMessageId = metaData.messages?.[0]?.id;

    // 2. Simpan catatan pesan keluar ke Supabase
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

    if (dbError) throw dbError;

    return res.status(200).json({
      status: 'success',
      message: 'Pesan berhasil terkirim dan disimpan.',
      data: dbData
    });

  } catch (error) {
    console.error('Error pada send-message:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
