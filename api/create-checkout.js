// pages/api/create-checkout.js

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // CORS preflight (safe to keep, helps if you post from static HTML)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic CORS (optional; tighten to your domain in prod)
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { email, name, supabase_user_id, affiliate_id } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });

    const body = {
      data: {
        type: 'checkouts',
        attributes: {
          product_options: {
            // Send buyer here after successful payment
            redirect_url: `${process.env.BASE_URL}/welcome.html`,
          },
          checkout_options: {
            // tweak UI if you want: discount, logo, subscription_preview, etc.
          },
          checkout_data: {
            email,
            name,
            custom: {
              supabase_user_id: supabase_user_id || null,
              affiliate_id: affiliate_id || null,
            },
          },
          // Helpful in dev
          test_mode: String(process.env.LS_TEST_MODE) === 'true',
        },
        relationships: {
          store:   { data: { type: 'stores',   id: String(process.env.LS_STORE_ID) } },
          variant: { data: { type: 'variants', id: String(process.env.LS_VARIANT_ID) } },
        },
      },
    };

    const r = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      const msg = data?.errors?.[0]?.detail || data?.error || 'Failed to create checkout';
      return res.status(r.status).json({ error: msg });
    }

    const url =
      data?.data?.attributes?.url ||
      data?.data?.data?.attributes?.url || // just in case of double-wrapped bodies
      null;

    if (!url) return res.status(500).json({ error: 'No checkout URL returned' });

    // Return a super simple shape for the frontend
    return res.status(200).json({ url });
  } catch (err) {
    console.error('create-checkout error:', err);
    return res.status(500).json({ error: 'Server error creating checkout' });
  }
}
