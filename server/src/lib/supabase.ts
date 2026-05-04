// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(): any {
  if (!_client) _client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  return _client
}

export async function saveArtifact(data: {
  brief: object
  design_system: string
  variants: object[]
  chosen_variant_id?: string
  final_html?: string
  parent_id?: string
}): Promise<string> {
  const { data: row, error } = await db()
    .from('design_history')
    .insert(data)
    .select('id')
    .single()
  if (error) throw error
  return row.id as string
}

export async function updateChosen(id: string, chosen_variant_id: string, final_html: string) {
  await db()
    .from('design_history')
    .update({ chosen_variant_id, final_html })
    .eq('id', id)
}

export async function getHistory(limit = 20) {
  const { data } = await db()
    .from('design_history')
    .select('id, brief, design_system, chosen_variant_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getArtifact(id: string) {
  const { data } = await db()
    .from('design_history')
    .select('*')
    .eq('id', id)
    .single()
  return data
}
