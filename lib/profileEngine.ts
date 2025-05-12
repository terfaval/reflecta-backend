
export function buildSystemPrompt(profile: Record<string, any>): string {
  const lines: string[] = []

  lines.push(`Te ${profile.name} vagy.`)
  if (profile.archetype) lines.push(profile.archetype)
  if (profile.domain) lines.push(`🔹 Területed: ${profile.domain}`)
  if (profile.worldview) lines.push(`🔹 Világképed: ${profile.worldview}`)

  if (profile.tone_style && typeof profile.tone_style === 'object') {
    lines.push(`\n🗣️ Hangnem és stílus:`)
    lines.push(...Object.entries(profile.tone_style).map(([k, v]) => `• ${k}: ${v}`))
  }

  if (Array.isArray(profile.question_logic) && profile.question_logic.length) {
    lines.push(`\n❓ Kérdéslogikád:`)
    lines.push(...profile.question_logic.map((q: string) => `• ${q}`))
  }

  if (Array.isArray(profile.ideal_usage) && profile.ideal_usage.length) {
    lines.push(`\n✅ Számodra ideális helyzetek:`)
    lines.push(...profile.ideal_usage.map((s: string) => `• ${s}`))
  }

  if (profile.not_suitable_for) {
    lines.push(`\n🚫 Nem alkalmas vagy ezekre:`)
    lines.push(`• ${profile.not_suitable_for}`)
  }

  if (Array.isArray(profile.reactions_common) && profile.reactions_common.length) {
    lines.push(`\n🤲 Általános reakcióid:`)
    lines.push(...profile.reactions_common.map((r: string) => `• ${r}`))
  }

  if (Array.isArray(profile.reactions_rare) && profile.reactions_rare.length) {
    lines.push(`\n🌑 Ritka, különleges reakcióid:`)
    lines.push(...profile.reactions_rare.map((r: string) => `• ${r}`))
  }

  if (Array.isArray(profile.highlight_keywords) && profile.highlight_keywords.length) {
    lines.push(`\n🧩 Kiemelt kulcskifejezések, amelyekre különösen érzékeny vagy:`)
    lines.push(...profile.highlight_keywords.map((k: string) => `• ${k}`))
  }

  if (profile.recommendation_logic) {
    lines.push(`\n📚 Ajánlási működésed:`)
    lines.push(`• ${profile.recommendation_logic}`)
  }

  if (profile.closing_trigger || profile.closing_style || profile.closing_note) {
    lines.push(`\n🕊️ Lezárásodra jellemző:`)
    if (profile.closing_trigger) lines.push(`• Lezárás indoka: ${profile.closing_trigger}`)
    if (profile.closing_style) lines.push(`• Stílus: ${profile.closing_style}`)
    if (profile.closing_note) lines.push(`• Zárómondat: ${profile.closing_note}`)
  }

  lines.push(`\n🔸 A bevezető szakasz során a felhasználó válaszformájára, szimbolikus stíluspreferenciájára, irányítási igényére és motivációjára is figyelsz. Ezekre reflektálhatsz később.`)

  lines.push(`\n❗ Fontos: Soha nem adsz tanácsot. Nem elemzel. Nem döntesz a felhasználó helyett.`)

  return lines.join('\n').trim()
}
