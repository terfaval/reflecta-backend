export function buildSystemPrompt(profile: any): string {
  const lines: string[] = []
  const p = profile as { [key: string]: any }

  lines.push(`Te ${p.name} vagy.`)
  if (p.archetype) lines.push(p.archetype)
  if (p.domain) lines.push(`🔹 Területed: ${p.domain}`)
  if (p.worldview) lines.push(`🔹 Világképed: ${p.worldview}`)

  if (p.tone_style && typeof p.tone_style === 'object') {
    lines.push(`\n🗣️ Hangnem és stílus:`)
    lines.push(...Object.entries(p.tone_style).map(([k, v]) => `• ${k}: ${v}`))
  }

  if (Array.isArray(p.question_logic) && p.question_logic.length) {
    lines.push(`\n❓ Kérdéslogikád:`)
    lines.push(...p.question_logic.map((q: string) => `• ${q}`))
  }

  if (Array.isArray(p.ideal_usage) && p.ideal_usage.length) {
    lines.push(`\n✅ Számodra ideális helyzetek:`)
    lines.push(...p.ideal_usage.map((s: string) => `• ${s}`))
  }

  if (p.not_suitable_for) {
    lines.push(`\n🚫 Nem alkalmas vagy ezekre:`)
    lines.push(`• ${p.not_suitable_for}`)
  }

  if (Array.isArray(p.reactions_common) && p.reactions_common.length) {
    lines.push(`\n🤲 Általános reakcióid:`)
    lines.push(...p.reactions_common.map((r: string) => `• ${r}`))
  }

  if (Array.isArray(p.reactions_rare) && p.reactions_rare.length) {
    lines.push(`\n🌑 Ritka, különleges reakcióid:`)
    lines.push(...p.reactions_rare.map((r: string) => `• ${r}`))
  }

  if (Array.isArray(p.highlight_keywords) && p.highlight_keywords.length) {
    lines.push(`\n🧩 Kiemelt kulcskifejezések, amelyekre különösen érzékeny vagy:`)
    lines.push(...p.highlight_keywords.map((k: string) => `• ${k}`))
  }

  if (p.recommendation_logic) {
    lines.push(`\n📚 Ajánlási működésed:`)
    lines.push(`• ${p.recommendation_logic}`)
  }

  if (p.closing_trigger || p.closing_style || p.closing_note) {
    lines.push(`\n🕊️ Lezárásodra jellemző:`)
    if (p.closing_trigger) lines.push(`• Lezárás indoka: ${p.closing_trigger}`)
    if (p.closing_style) lines.push(`• Stílus: ${p.closing_style}`)
    if (p.closing_note) lines.push(`• Zárómondat: ${p.closing_note}`)
  }

  lines.push(`\n🔸 A bevezető szakasz során a felhasználó válaszformájára, szimbolikus stíluspreferenciájára, irányítási igényére és motivációjára is figyelsz. Ezekre reflektálhatsz később.`)

  lines.push(`\n❗ Fontos: Soha nem adsz tanácsot. Nem elemzel. Nem döntesz a felhasználó helyett.`)

  return lines.join('\n').trim()
}
