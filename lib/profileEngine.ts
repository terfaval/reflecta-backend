export function buildSystemPrompt(profile: Record<string, unknown>): string {
  const lines: string[] = []

  const get = (key: string): string | undefined => {
    const val = profile[key]
    return typeof val === 'string' ? val : undefined
  }

  const getArray = (key: string): string[] => {
    const val = profile[key]
    return Array.isArray(val) ? val.filter(v => typeof v === 'string') : []
  }

  const getObject = (key: string): Record<string, string> => {
    const val = profile[key]
    return typeof val === 'object' && val !== null && !Array.isArray(val)
      ? (val as Record<string, string>)
      : {}
  }

  lines.push(`Te ${get('name') || 'Reflecta-profil'} vagy.`)
  if (get('archetype')) lines.push(get('archetype')!)
  if (get('domain')) lines.push(`🔹 Területed: ${get('domain')}`)
  if (get('worldview')) lines.push(`🔹 Világképed: ${get('worldview')}`)

  const tone = getObject('tone_style')
  if (Object.keys(tone).length > 0) {
    lines.push(`\n🗣️ Hangnem és stílus:`)
    lines.push(...Object.entries(tone).map(([k, v]) => `• ${k}: ${v}`))
  }

  const questions = getArray('question_logic')
  if (questions.length) {
    lines.push(`\n❓ Kérdéslogikád:`)
    lines.push(...questions.map(q => `• ${q}`))
  }

  const ideal = getArray('ideal_usage')
  if (ideal.length) {
    lines.push(`\n✅ Számodra ideális helyzetek:`)
    lines.push(...ideal.map(i => `• ${i}`))
  }

  if (get('not_suitable_for')) {
    lines.push(`\n🚫 Nem alkalmas vagy ezekre:`)
    lines.push(`• ${get('not_suitable_for')}`)
  }

  const common = getArray('reactions_common')
  if (common.length) {
    lines.push(`\n🤲 Általános reakcióid:`)
    lines.push(...common.map(r => `• ${r}`))
  }

  const rare = getArray('reactions_rare')
  if (rare.length) {
    lines.push(`\n🌑 Ritka, különleges reakcióid:`)
    lines.push(...rare.map(r => `• ${r}`))
  }

  const highlights = getArray('highlight_keywords')
  if (highlights.length) {
    lines.push(`\n🧩 Kiemelt kulcskifejezések, amelyekre különösen érzékeny vagy:`)
    lines.push(...highlights.map(k => `• ${k}`))
  }

  if (get('recommendation_logic')) {
    lines.push(`\n📚 Ajánlási működésed:`)
    lines.push(`• ${get('recommendation_logic')}`)
  }

  if (get('closing_trigger') || get('closing_style') || get('closing_note')) {
    lines.push(`\n🕊️ Lezárásodra jellemző:`)
    if (get('closing_trigger')) lines.push(`• Lezárás indoka: ${get('closing_trigger')}`)
    if (get('closing_style')) lines.push(`• Stílus: ${get('closing_style')}`)
    if (get('closing_note')) lines.push(`• Zárómondat: ${get('closing_note')}`)
  }

  lines.push(`\n🔸 A bevezető szakasz során a felhasználó válaszformájára, szimbolikus stíluspreferenciájára, irányítási igényére és motivációjára is figyelsz. Ezekre reflektálhatsz később.`)

  lines.push(`\n❗ Fontos: Soha nem adsz tanácsot. Nem elemzel. Nem döntesz a felhasználó helyett.`)

  return lines.join('\n').trim()
}
