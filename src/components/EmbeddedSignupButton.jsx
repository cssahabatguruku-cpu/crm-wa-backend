import React, { useEffect, useState } from 'react';

// ID Aplikasi Meta Developer Anda (diambil dari dasbor Meta Developer)
const FB_APP_ID = '4375533279334239';

// ID Konfigurasi Facebook Login for Business (dari Facebook Login for Business -> Configurations)
const CONFIG_ID = 'ISIKAN_CONFIG_ID_DARI_META';

export default function EmbeddedSignupButton({ onSuccess }) {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // 1. Memuat Facebook JS SDK resmi
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v20.0',
      });
      setSdkLoaded(true);
    };

    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode.insertBefore(js, fjs);
    })(document, 'script', 'facebook-jssdk');

    // 2. Event Listener untuk menangkap payload callback dari Pop-Up Meta
    const handleMetaMessage = (event) => {
      if (
        event.origin !== 'https://www.facebook.com' &&
        event.origin !== 'https://web.facebook.com'
      ) {
        return;
      }

      try {
        const data = JSON.parse(event.data);
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            const { phone_number_id, waba_id } = data.data;
            console.log('Embedded Signup Berhasil Ditangkap:', { phone_number_id, waba_id });

            if (onSuccess) {
              onSuccess({
                phone_number_id,
                waba_id,
              });
            }
          } else if (data.event === 'CANCEL') {
            console.warn('Pengguna membatalkan alur Embedded Signup Meta');
          }
        }
      } catch (err) {
        // Abaikan event non-JSON
      }
    };

    window.addEventListener('message', handleMetaMessage);
    return () => window.removeEventListener('message', handleMetaMessage);
  }, [onSuccess]);

  // 3. Menjalankan Pop-Up Meta
  const launchEmbeddedSignup = () => {
    if (!window.FB) {
      alert('Facebook SDK sedang dimuat. Harap coba lagi dalam 3 detik.');
      return;
    }

    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          console.log('Authorization Code Meta:', code);
        }
      },
      {
        config_id: CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
        },
      }
    );
  };

  return (
    <button
      type="button"
      onClick={launchEmbeddedSignup}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs w-full cursor-pointer"
    >
      <span>🔵 Auto-Connect via Meta (Embedded Signup & QR Code)</span>
    </button>
  );
}