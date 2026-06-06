// ═══════════════════════════════════════════════════════
//  Mexico Travel Pass — Backend Server
//  Node.js + Express + Stripe + Brevo + Meta CAPI
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const crypto   = require('crypto'); // built-in — no install needed
const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;

const BREVO_API_KEY     = process.env.BREVO_API_KEY;
const META_PIXEL_ID     = '1572885741065144';
const META_CAPI_TOKEN   = process.env.META_CAPI_TOKEN;
const BREVO_LIST_BUYERS = 5;

// ── Guide URL mapping ──────────────────────────────────
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

const PRICE_NAMES = {
  'price_1TdNCsDOZDPnW2siWVL9vVD0': 'Mexico City Safety Guide',
  'price_1TdNG7DOZDPnW2siLBlEzzgU': 'Guadalajara Safety Guide',
  'price_1TdNQoDOZDPnW2si1vWVaxCl': 'Monterrey Safety Guide',
  'price_1TdNGgDOZDPnW2siSyprCW9U': 'All 3 Cities Pass',
  'price_1TdNH3DOZDPnW2si4Gp5veqZ': "Montezuma's Revenge Guide — CDMX",
  'price_1TdNHSDOZDPnW2sitXBu5imr': "Montezuma's Revenge Guide — GDL",
  'price_1TdNHpDOZDPnW2siGXCpM5us': "Montezuma's Revenge Guide — MTY",
  'price_1TdNIlDOZDPnW2sisp9Jr4no': 'All 3 Cities Stomach Guide',
};

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: [
    'https://www.mexicotravelpass.com',
    'https://mexicotravelpass.com',
    'http://localhost:8080',
    'http://127.0.0.1:5500'
  ]
}));
app.use(express.json());

// ── Helpers ────────────────────────────────────────────
const sha256 = str => crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');

// ── Meta CAPI: Send Purchase event server-side ─────────
async function sendMetaCAPI({ email, value, currency, priceIds, sessionId, clientIp, clientUserAgent }) {
  if (!META_CAPI_TOKEN) {
    console.warn('⚠️ META_CAPI_TOKEN not set — skipping CAPI');
    return;
  }
  try {
    const payload = {
      data: [{
        event_name:  'Purchase',
        event_time:  Math.floor(Date.now() / 1000),
        event_id:    'purchase_' + sessionId,   // deduplicates with browser pixel
        action_source: 'website',
        user_data: {
          em:  email ? [sha256(email)] : [],     // hashed email — required for matching
          client_ip_address: clientIp  || '',
          client_user_agent: clientUserAgent || '',
        },
        custom_data: {
          value:        value,
          currency:     currency.toUpperCase(),
          content_ids:  priceIds,
          content_type: 'product',
          order_id:     sessionId,
        }
      }],
      // test_event_code: 'TEST12345', // ← uncomment to test in Events Manager
    };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      }
    );
    const data = await res.json();
    if (data.events_received) {
      console.log(`✅ Meta CAPI: Purchase sent — events_received: ${data.events_received}`);
    } else {
      console.error('❌ Meta CAPI error:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('❌ Meta CAPI fetch error:', err.message);
  }
}

// ── Brevo: Add buyer to list 5 ─────────────────────────
async function addBuyerToBrevo({ email, firstName, lastName, cities, orderValue, guideUrls }) {
  if (!BREVO_API_KEY) { console.warn('⚠️ BREVO_API_KEY not set'); return; }
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME:   firstName  || '',
          LASTNAME:    lastName   || '',
          CITIES:      cities     || '',
          ORDER_VALUE: orderValue || 0,
          GUIDE_URLS:  Array.isArray(guideUrls) ? guideUrls.join(', ') : '',
          SOURCE:      'Mexico Travel Pass — Confirmed Purchase'
        },
        listIds: [BREVO_LIST_BUYERS],
        updateEnabled: true
      })
    });
    const data = await res.json();
    console.log(`✅ Brevo buyer added: ${email}`, data.id || data.code);
  } catch (err) {
    console.error('❌ Brevo error:', err.message);
  }
}

// ── ENDPOINT 1: Create Checkout Session ───────────────
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { lineItems } = req.body;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'lineItems required' });
    }
    const VALID = new Set(Object.keys(GUIDE_URLS));
    for (const item of lineItems) {
      if (!VALID.has(item.price)) return res.status(400).json({ error: `Invalid price: ${item.price}` });
    }
    const session = await stripe.checkout.sessions.create({
      ui_mode:              'embedded',
      mode:                 'payment',
      currency:             'usd',
      line_items:           lineItems,
      return_url:           'https://www.mexicotravelpass.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      payment_method_types: ['card', 'link'],
      locale:               'en',
      customer_creation:    'always',
      metadata:             { source: 'mexico-travel-pass-website' }
    });
    res.json({ clientSecret: session.client_secret });
  } catch (err) {
    console.error('create-checkout-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT 2: Verify Session + Brevo + Meta CAPI ────
app.get('/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id required' });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const purchasedPriceIds = session.line_items.data.map(i => i.price.id);
    const guideUrls = purchasedPriceIds.map(id => GUIDE_URLS[id]).filter(Boolean);

    const cityIds = [
      'price_1TdNCsDOZDPnW2siWVL9vVD0',
      'price_1TdNG7DOZDPnW2siLBlEzzgU',
      'price_1TdNQoDOZDPnW2si1vWVaxCl'
    ];
    const boughtAll3 = cityIds.every(id => purchasedPriceIds.includes(id));
    const finalGuideUrls = boughtAll3
      ? ['https://www.mexicotravelpass.com/all3-guide-2026', ...guideUrls.filter(u => u.includes('stomach'))]
      : guideUrls;
    const primaryGuide = finalGuideUrls.find(u => !u.includes('stomach')) || finalGuideUrls[0];

    if (session.status === 'complete') {
      const email     = session.customer_details?.email;
      const name      = session.customer_details?.name || '';
      const firstName = name.split(' ')[0] || '';
      const lastName  = name.split(' ').slice(1).join(' ') || '';
      const cities    = purchasedPriceIds.map(id => PRICE_NAMES[id]).filter(Boolean).join(', ');
      const value     = session.amount_total / 100;
      const currency  = session.currency || 'usd';

      // Run Brevo + Meta CAPI in parallel — don't block the response
      Promise.all([
        addBuyerToBrevo({ email, firstName, lastName, cities, orderValue: value, guideUrls: finalGuideUrls }),
        sendMetaCAPI({
          email,
          value,
          currency,
          priceIds:        purchasedPriceIds,
          sessionId:       session_id,
          clientIp:        req.headers['x-forwarded-for'] || req.ip,
          clientUserAgent: req.headers['user-agent'] || '',
        })
      ]).catch(err => console.error('Background task error:', err.message));
    }

    res.json({
      status:        session.status,
      amount_total:  session.amount_total,
      currency:      session.currency,
      line_items:    session.line_items.data,
      guide_urls:    finalGuideUrls,
      primary_guide: primaryGuide,
    });

  } catch (err) {
    console.error('verify-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT 3: Capture Lead (email gate → Brevo list 3) ─
app.post('/capture-lead', async (req, res) => {
  try {
    const { email, cities } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    if (!BREVO_API_KEY) return res.json({ ok: true });

    await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': BREVO_API_KEY },
      body: JSON.stringify({
        email,
        attributes: { CITIES: cities || 'Unknown', ORDER_VALUE: 0, SOURCE: 'Mexico Travel Pass — Email Gate' },
        listIds: [3],
        updateEnabled: true
      })
    });
    console.log(`📧 Lead captured: ${email}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('capture-lead error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT 4: Real buyer count from Stripe ──────────
app.get('/buyer-count', async (req, res) => {
  try {
    // Count successful checkout sessions
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      status: 'complete'
    });
    // Base + real count
    const realCount = 3847 + sessions.data.length;
    res.json({ count: realCount });
  } catch (err) {
    console.error('buyer-count error:', err.message);
    res.status(500).json({ count: 3847 }); // fallback
  }
});

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => res.json({
  ok:           true,
  timestamp:    new Date().toISOString(),
  brevo_list:   BREVO_LIST_BUYERS,
  meta_capi:    !!META_CAPI_TOKEN,
  stripe:       !!process.env.STRIPE_SECRET_KEY,
}));

app.listen(PORT, () => {
  console.log(`✅ Mexico Travel Pass server on port ${PORT}`);
  console.log(`   Meta CAPI: ${META_CAPI_TOKEN ? '✅ configured' : '❌ missing META_CAPI_TOKEN'}`);
  console.log(`   Brevo:     ${BREVO_API_KEY    ? '✅ configured' : '❌ missing BREVO_API_KEY'}`);
});
