
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, name, supabase_user_id, affiliate_id } = req.body || {}
  if (!email) return res.status(400).json({ error: 'email required' })

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        // send them back to your post-checkout page
        product_options: {
          redirect_url: `${process.env.BASE_URL}/welcome.html`
          // (optional) you can also override name/description/media here if you want
        },
        checkout_options: {
          // (optional) example tweaks
          // discount: false, media: false, logo: true, subscription_preview: true
        },
        checkout_data: {
          email,
          name,
          custom: {
            supabase_user_id,
            affiliate_id: affiliate_id || null
          }
        },
        // helpful in dev
        test_mode: process.env.LS_TEST_MODE === 'true'
      },
      relationships: {
        store:   { data: { type: 'stores',   id: String(process.env.LS_STORE_ID) } },
        variant: { data: { type: 'variants', id: String(process.env.LS_VARIANT_ID) } }
      }
    }
  }

  const r = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  if (!r.ok) {
    const txt = await r.text()
    return res.status(502).json({ error: 'LS create-checkout failed', detail: txt })
  }

  const json = await r.json()
  return res.status(200).json({ url: json?.data?.attributes?.url })
}
