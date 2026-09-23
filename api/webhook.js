import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client menggunakan Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
// Gunakan Service Role Key agar backend bisa bypass RLS saat menulis data
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // ==========================================
  // 1. HANDLER UNTUK VERIFIKASI WEBHOOK (GET)
  // ==========================================
  if (req.method === 'GET') {
    const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook terverifikasi oleh Meta!');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Token verifikasi tidak valid' });
    }
  }

  // ==========================================
  // 2. HANDLER UNTUK MENERIMA PESAN WA (POST)
  // ==========================================
  if (req.method === 'POST') {
    const { body } = req;

    // Pastikan payload berasal dari WhatsApp
    if (body.object === 'whatsapp_business_account') {
      try {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            const value = change.value;

            // --- A. SKENARIO PESAN MASUK BARU ---
            if (value.messages && value.messages.length > 0) {
              const message = value.messages[0];
              const contactProfile = value.contacts[0].profile;
              
              const phone = message.from;
              const name = contactProfile.name;
              const messageId = message.id;
              const type = message.type;
              
              // Ambil isi pesan (contoh ini fokus pada tipe 'text')
              let content = '';
              if (type === 'text') {
                content = message.text.body;
              } else {
                content = `[Menerima lampiran tipe: ${type}]`;
              }

              // Langkah 1: Pastikan kontak ada di Supabase (Upsert berdasarkan nomor HP)
              const { data: contactData, error: contactError } = await supabase
                .from('contacts')
                .upsert(
                  { phone_number: phone, name: name },
                  { onConflict: 'phone_number' }
                )
                .select()
                .single();

              if (contactError) throw contactError;

              // Langkah 2: Simpan pesan masuk ke tabel messages
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
              
              console.log(`Pesan masuk dari ${name} (${phone}) berhasil disimpan.`);
            }

            // --- B. SKENARIO UPDATE STATUS PESAN (Sent/Delivered/Read) ---
            if (value.statuses && value.statuses.length > 0) {
              const statusObj = value.statuses[0];
              const messageId = statusObj.id;
              const status = statusObj.status; // 'sent', 'delivered', atau 'read'

              // Update status pesan keluar di database
              await supabase
                .from('messages')
                .update({ status: status })
                .eq('wa_message_id', messageId);
                
              console.log(`Status pesan ${messageId} diperbarui menjadi ${status}.`);
            }
          }
        }
        
        // Selalu kembalikan status 200 OK ke Meta sesegera mungkin
        return res.status(200).send('EVENT_RECEIVED');
        
      } catch (error) {
        console.error('Error saat memproses webhook:', error.message);
        // Tetap kembalikan 200 agar Meta tidak menganggap server mati dan terus melakukan retry berulang kali
        return res.status(200).send('EVENT_RECEIVED');
      }
    } else {
      return res.status(404).send('Not Found');
    }
  }

  // Jika metode selain GET atau POST
  return res.status(405).json({ error: 'Method not allowed' });
}
