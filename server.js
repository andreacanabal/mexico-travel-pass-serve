<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Guide is Ready — Mexico Travel Pass</title>

<!-- Meta Pixel -->
<script>
window.fbq=window.fbq||function(){(window.fbq.q=window.fbq.q||[]).push(arguments)};
window.fbq.q=window.fbq.q||[];window.fbq.loaded=true;window.fbq.version='2.0';
window.addEventListener('load',function(){
  var t=document.createElement('script');t.async=true;
  t.src='https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(t);
  t.onload=function(){fbq('init','1572885741065144');fbq('track','PageView');};
});
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1572885741065144&ev=PageView&noscript=1"/></noscript>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka+One&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">

<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Nunito',sans-serif;background:#050D1F;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;}
.card{background:#FFFBF0;border:3px solid #0A0A0A;border-radius:20px;box-shadow:8px 8px 0 #F5C518;max-width:460px;width:100%;padding:36px 28px;text-align:center;color:#0A0A0A;}
.badge{display:inline-flex;align-items:center;gap:6px;background:#1A7A4A;color:#fff;font-family:'Fredoka One',cursive;font-size:13px;padding:5px 16px;border-radius:99px;border:2px solid #0A0A0A;box-shadow:2px 2px 0 #0A0A0A;margin-bottom:18px;}
h1{font-family:'Bangers',cursive;font-size:clamp(28px,7vw,40px);color:#1A3FAA;letter-spacing:1px;line-height:1.05;margin-bottom:12px;}
.subtitle{font-size:15px;font-weight:600;color:#444;line-height:1.6;margin-bottom:22px;}
.guide-btn{display:flex;align-items:center;justify-content:center;gap:8px;background:#D42B2B;color:#fff;font-family:'Bangers',cursive;font-size:20px;letter-spacing:1px;border:3px solid #0A0A0A;border-radius:12px;box-shadow:4px 4px 0 #0A0A0A;padding:15px 24px;width:100%;text-decoration:none;margin-bottom:10px;transition:transform 80ms,box-shadow 80ms;cursor:pointer;}
.guide-btn:hover{transform:translate(-1px,-1px);box-shadow:5px 5px 0 #0A0A0A;}
.guide-btn.secondary{background:#F5C518;color:#0A0A0A;font-size:16px;}
.extra-guides{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.email-note{background:rgba(26,58,170,0.07);border:1.5px solid rgba(26,58,170,0.2);border-radius:10px;padding:12px 14px;font-size:13px;font-weight:600;color:#1A3FAA;display:flex;align-items:flex-start;gap:8px;text-align:left;margin-bottom:18px;}
.back-link{font-family:'Nunito',sans-serif;font-size:13px;color:#999;text-decoration:underline;cursor:pointer;background:none;border:none;}
.error-box{background:#fff5f5;border:2px solid #D42B2B;border-radius:12px;padding:14px;font-size:14px;font-weight:600;color:#D42B2B;margin-bottom:16px;}
.spinner{width:44px;height:44px;border:4px solid rgba(245,197,24,0.25);border-top:4px solid #F5C518;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-wrap{color:rgba(255,255,255,0.7);font-family:'Fredoka One',cursive;font-size:16px;text-align:center;}
#loading{display:flex;align-items:center;justify-content:center;}
#success,#error{display:none;}
</style>
</head>
<body>

<div id="loading">
  <div class="loading-wrap">
    <div class="spinner"></div>
    Verifying your purchase...
  </div>
</div>

<div id="success" class="card">
  <div class="badge">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    PAYMENT CONFIRMED
  </div>
  <h1>YOUR GUIDE IS READY!</h1>
  <p class="subtitle">Click below to access your guide now.<br>A copy was also sent to your email.</p>
  <div class="extra-guides" id="guide-buttons"></div>
  <div class="email-note">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    <span>Check your inbox — download link sent to your email. Check spam if you don't see it in 2 minutes.</span>
  </div>
  <button class="back-link" onclick="window.location='https://www.mexicotravelpass.com'">← Back to mexicotravelpass.com</button>
</div>

<div id="error" class="card">
  <h1 style="color:#D42B2B;margin-bottom:16px;">SOMETHING WENT WRONG</h1>
  <div class="error-box" id="error-msg">Unable to verify your payment.</div>
  <p style="font-size:14px;color:#444;margin-bottom:20px;">If you were charged, email us at<br><strong>support@mexicotravelpass.com</strong></p>
  <a href="https://www.mexicotravelpass.com" class="guide-btn secondary">← Back to Home</a>
</div>

<script>
const SERVER_URL = 'https://mexico-travel-pass-serve-production.up.railway.app';
const BREVO_API_KEY = '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';

const GUIDE_NAMES = {
  'price_1TdNCsDOZDPnW2siWVL9vVD0': 'Mexico City Safety Guide',
  'price_1TdNG7DOZDPnW2siLBlEzzgU': 'Guadalajara Safety Guide',
  'price_1TdNQoDOZDPnW2si1vWVaxCl': 'Monterrey Safety Guide',
  'price_1TdNGgDOZDPnW2siSyprCW9U': 'All 3 Cities Pass',
  'price_1TdNH3DOZDPnW2si4Gp5veqZ': "Montezuma's Revenge Guide — CDMX",
  'price_1TdNHSDOZDPnW2sitXBu5imr': "Montezuma's Revenge Guide — GDL",
  'price_1TdNHpDOZDPnW2siGXCpM5us': "Montezuma's Revenge Guide — MTY",
  'price_1TdNIlDOZDPnW2sisp9Jr4no': 'All 3 Cities Stomach Guide',
};

const GUIDE_URLS = {
  'price_1TdNCsDOZDPnW2siWVL9vVD0': 'https://www.mexicotravelpass.com/cdmx-guide-2026',
  'price_1TdNG7DOZDPnW2siLBlEzzgU': 'https://www.mexicotravelpass.com/GDL-guide-2026',
  'price_1TdNQoDOZDPnW2si1vWVaxCl': 'https://www.mexicotravelpass.com/MTY-guide-2026',
  'price_1TdNGgDOZDPnW2siSyprCW9U': 'https://www.mexicotravelpass.com/all3-guide-2026',
  'price_1TdNH3DOZDPnW2si4Gp5veqZ': 'https://www.mexicotravelpass.com/cdmx_stomach-2026',
  'price_1TdNHSDOZDPnW2sitXBu5imr': 'https://www.mexicotravelpass.com/GDL_stomach-2026',
  'price_1TdNHpDOZDPnW2siGXCpM5us': 'https://www.mexicotravelpass.com/MTY_stomach-2026',
  'price_1TdNIlDOZDPnW2sisp9Jr4no': 'https://www.mexicotravelpass.com/All3_stomach-2026',
};

function show(id) {
  ['loading','success','error'].forEach(i => {
    const el = document.getElementById(i);
    el.style.display = i === id ? (id === 'loading' ? 'flex' : 'block') : 'none';
  });
}

// ── Send to Brevo with ORDER_VALUE to trigger automation ──
function notifyBrevo(email, firstName, cities, orderValue, guideUrls) {
  fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({
      email: email,
      attributes: {
        FIRSTNAME:    firstName || '',
        CITIES:       cities,
        ORDER_VALUE:  orderValue,
        GUIDE_URLS:   guideUrls.join(', '),
        SOURCE:       'Mexico Travel Pass - Confirmed Purchase',
        PURCHASE_DATE: new Date().toISOString().split('T')[0]
      },
      listIds: [3],        // List ID 3 = Confirmed Buyers (create this in Brevo)
      updateEnabled: true
    })
  }).catch(() => {});      // silent fail

  // Also add to abandoned cart list to REMOVE them (they bought)
  fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
    body: JSON.stringify({
      email: email,
      attributes: { ORDER_VALUE: orderValue },
      listIds: [2],
      updateEnabled: true
    })
  }).catch(() => {});
}

async function verify() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');

  if (!sessionId) {
    document.getElementById('error-msg').textContent = 'No session ID found. Please contact support.';
    show('error');
    return;
  }

  try {
    const res  = await fetch(`${SERVER_URL}/verify-session?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Verification failed');

    if (data.status === 'complete') {

      // ── Meta Pixel Purchase — value from Stripe, never hardcoded ──
      const priceIds = (data.line_items || []).map(i => i.price?.id).filter(Boolean);
      const purchaseValue = data.amount_total / 100;

      if (typeof fbq !== 'undefined') {
        // Recover fbclid saved in index.html for attribution
        const fbclid   = localStorage.getItem('mtp_fbclid') || '';
        const eventID  = fbclid ? 'purchase_' + fbclid : 'purchase_' + sessionId;
        fbq('track', 'Purchase', {
          value:        purchaseValue,           // Real amount from Stripe
          currency:     (data.currency || 'usd').toUpperCase(),
          content_ids:  priceIds,
          content_type: 'product'
        }, { eventID: eventID });
        // Clean up fbclid after use
        localStorage.removeItem('mtp_fbclid');
      }

      // ── Build guide URLs ──
      const guideUrls = priceIds.map(id => GUIDE_URLS[id]).filter(Boolean);
      const primaryGuide = guideUrls.find(u => !u.includes('stomach')) || guideUrls[0];

      // ── Notify Brevo with purchase data → triggers automation ──
      const savedEmail = localStorage.getItem('mtp_lead_email') || '';
      const savedName  = localStorage.getItem('mtp_lead_name')  || '';
      const cities     = priceIds.map(id => GUIDE_NAMES[id]).filter(Boolean).join(', ');
      if (savedEmail) {
        notifyBrevo(savedEmail, savedName.split(' ')[0], cities, purchaseValue, guideUrls);
      }

      // ── Build guide buttons ──
      const btns = document.getElementById('guide-buttons');
      guideUrls.forEach((url, i) => {
        const a = document.createElement('a');
        a.href = url;
        a.className = 'guide-btn' + (i > 0 ? ' secondary' : '');
        const name = Object.entries(GUIDE_URLS).find(([,v]) => v === url)?.[0];
        a.textContent = (i === 0 ? '→ ' : '') + (GUIDE_NAMES[name] || 'Open Your Guide');
        btns.appendChild(a);
      });

      // ── Auto-redirect if single guide ──
      if (guideUrls.length === 1 && primaryGuide) {
        document.querySelector('.subtitle').textContent = 'Redirecting to your guide in 2 seconds...';
        setTimeout(() => { window.location.href = primaryGuide; }, 2000);
      }

      show('success');

    } else {
      document.getElementById('error-msg').textContent = `Payment status: "${data.status}". Contact support if you were charged.`;
      show('error');
    }

  } catch (err) {
    console.error(err);
    document.getElementById('error-msg').textContent = err.message;
    show('error');
  }
}

verify();
</script>
</body>
</html>
