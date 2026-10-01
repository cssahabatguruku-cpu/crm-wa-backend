import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Token verifikasi tidak valid' });
    }
  }

  if (req.method === 'POST') {
    const { body } = req;

    if (body.object === 'whatsapp_business_account') {
      try {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            const value = change.value;

            // Tangkap ID nomor WhatsApp penerima (Multi-Channel Routing)
            const receiverPhoneId = value.metadata?.phone_number_id;

            if (value.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const contactProfile = value.contacts?.[0]?.profile || {};
              
              const phone = message.from;
              const name = contactProfile.name || phone;
              const messageId = message.id;
              const type = message.type;
              
              let content = '';
              if (type === 'text') {
                content = message.text.body;
              } else {
                content = `[Menerima lampiran tipe: ${type}]`;
              }

              // 1. Upsert kontak ke Supabase
              const { data: contactData, error: contactError } = await supabase
                .from('contacts')
                .upsert(
                  { phone_number: phone, name: name },
                  { onConflict: 'phone_number' }
                )
                .select()
                .single();

              if (contactError) throw contactError;

              // 2. Simpan pesan masuk ke tabel messages
              const { error: msgError } = await supabase
                .from('messages')
                .insert({
                  wa_message_id: messageId,
                  contact_id: contactData.id,
                  content: content,
                  type: type,
                  direction: 'inbound',
                  status: 'received'
                });

              if (msgError) throw msgError;
            }

            // Update status pesan (Sent/Delivered/Read)
            if (value.statuses && value.statuses.length > 0) {
              const statusObj = value.statuses[0];
              await supabase
                .from('messages')
                .update({ status: statusObj.status })
                .eq('wa_message_id', statusObj.id);
            }
          }
        }
        
        return res.status(200).send('EVENT_RECEIVED');
      } catch (error) {
        console.error('Error Webhook:', error.message);
        return res.status(200).send('EVENT_RECEIVED');
      }
    } else {
      return res.status(404).send('Not Found');
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}