import { createClient } from '@supabase/supabase-js'
export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).end()
  const { id, full_name, market } = req.body || {}
  if (!id) return res.status(400).json({ error:'Missing id' })
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  const { error } = await sb.from('profiles').upsert({ id, full_name, market, updated_at:new Date().toISOString() })
  if (error) return res.status(500).json({ error: error.message })
  res.status(200).json({ ok:true })
}
