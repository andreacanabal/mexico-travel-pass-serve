// ═══════════════════════════════════════════════════════
//  Mexico Travel Pass — Backend Server
//  Node.js + Express + Stripe + Brevo
// ═══════════════════════════════════════════════════════

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;

const BREVO_API_KEY      = process.env.BREVO_API_KEY || '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';
const BREVO_LIST_BUYERS  = 5; // MTP Buyers — triggers automations 3 & 4

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

// ── Brevo: Add contact to list 5 → triggers automations ──
async function addBuyerToBrevo({ email, firstName, lastName, cities, orderValue, guideUrls }) {
  try {
    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME:   firstName  || '',
          LASTNAME:    lastName   || '',
          CITIES:      cities     || '',
          ORDER_VALUE: orderValue || 0,
          GUIDE_URLS:  Array.isArray(guideUrls) ? guideUrls.join(', ') : guideUrls || '',
          SOURCE:      'Mexico Travel Pass — Confirmed Purchase'
        },
        listIds: [BREVO_LIST_BUYERS], // Adding to list 5 auto-triggers automations 3 & 4
        updateEnabled: true
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Brevo: buyer added to list ${BREVO_LIST_BUYERS} → email: ${email}`);
    } else {
      console.error('❌ Brevo error:', data);
    }
    return data;
  } catch (err) {
    console.error('❌ Brevo fetch error:', err.message);
  }
}

// ── ENDPOINT 1: Create Checkout Session ───────────────
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { lineItems } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'lineItems array is required' });
    }

    const VALID_PRICES = new Set(Object.keys(GUIDE_URLS));
    for (const item of lineItems) {
      if (!VALID_PRICES.has(item.price)) {
        return res.status(400).json({ error: `Invalid price ID: ${item.price}` });
      }
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      currency: 'usd',
      line_items: lineItems,
      return_url: 'https://www.mexicotravelpass.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      payment_method_types: ['card', 'link'],
      locale: 'en',
      customer_creation: 'always',
      metadata: { source: 'mexico-travel-pass-website' }
    });

    res.json({ clientSecret: session.client_secret });

  } catch (err) {
    console.error('create-checkout-session error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ENDPOINT 2: Verify Session + Add to Brevo ─────────
app.get('/verify-session', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id required' });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items']
    });

    const purchasedPriceIds = session.line_items.data.map(i => i.price.id);
    const guideUrls = purchasedPriceIds.map(id => GUIDE_URLS[id]).filter(Boolean);

    // If 3 individual city guides, redirect to all3
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

    // ── Add buyer to Brevo list 5 (triggers automations 3 & 4) ──
    if (session.status === 'complete') {
      const email     = session.customer_details?.email;
      const name      = session.customer_details?.name || '';
      const firstName = name.split(' ')[0] || '';
      const lastName  = name.split(' ').slice(1).join(' ') || '';
      const cities    = purchasedPriceIds
        .map(id => PRICE_NAMES[id])
        .filter(Boolean)
        .join(', ');

      if (email) {
        await addBuyerToBrevo({
          email,
          firstName,
          lastName,
          cities,
          orderValue:  session.amount_total / 100,
          guideUrls:   finalGuideUrls
        });
      } else {
        console.warn('⚠️ No email found in session — Brevo not notified');
      }
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


// ── ENDPOINT 3: Capture Lead (email gate → Brevo list 3) ──
app.post('/capture-lead', async (req, res) => {
  try {
    const { email, cities } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const response = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        attributes: {
          CITIES:      cities || 'Unknown',
          ORDER_VALUE: 0,
          SOURCE:      'Mexico Travel Pass — Email Gate'
        },
        listIds: [3], // identified_contacts → triggers abandon cart automation 2
        updateEnabled: true
      })
    });

    const data = await response.json();
    console.log(`📧 Lead captured: ${email} — ${cities}`);
    res.json({ ok: true });

  } catch (err) {
    console.error('capture-lead error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ───────────────────────────────────────
app.get('/health', (req, res) => res.json({
  ok: true,
  timestamp: new Date().toISOString(),
  brevo_list: BREVO_LIST_BUYERS
}));

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Mexico Travel Pass server running on port ${PORT}`);
  console.log(`📧 Brevo list: ${BREVO_LIST_BUYERS} (triggers automations 3 & 4)`);
});
