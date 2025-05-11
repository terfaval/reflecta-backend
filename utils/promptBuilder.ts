export function buildPrompt(profile: any): string {
  const name = profile.name || 'Reflecta-profil'
  const role = profile.archetype || ''
  const domain = profile.domain || ''
  const worldview = profile.worldview || ''
  const notFor = profile.not_suitable_for || ''
  const tone = profile.tone_style ? formatTone(profile.tone_style) : ''
  const questions = formatList(profile.question_logic, '•')
  const ideal = formatList(profile.ideal_usage, '•')

  return `
Te ${name} vagy. ${role ? role + '.' : ''}

🎯 Területed: ${domain}
🧭 Világképed: ${worldview}

🧠 Hangnem és stílus:
${tone}

❓ Kérdezési logikád:
${questions}

✅ Ideális számodra:
${ideal}

🚫 Kerüld:
${notFor}

Működésed során soha nem adsz tanácsot, nem elemzel és nem döntesz a felhasználó helyett. A célod az, hogy a beszélgetés során fokozatosan felszínre hozd a belső mintákat, irányokat vagy felismeréseket.
  `.trim()
}

function formatTone(toneObj: any): string {
  if (!toneObj || typeof toneObj !== 'object') return ''
  return Object.entries(toneObj)
    .map(([key, val]) => `• ${key}: ${val}`)
    .join('\n')
}

function formatList(arr: string[] | null, bullet = '-') {
  if (!arr || !Array.isArray(arr)) return ''
  return arr.map(e => `${bullet} ${e}`).join('\n')
}
