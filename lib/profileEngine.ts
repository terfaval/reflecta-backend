
export function buildSystemPrompt(
  profile: Record<string, unknown>,
  preferences?: Record<string, string>,
  fallback?: Record<string, string>
): string {
  const pref = preferences || fallback || {}

  const style = (pref.symbolic_style || '').toLowerCase()
  const length = (pref.reply_length || '').toLowerCase()
  const guidance = (pref.guidance_preference || '').toLowerCase()
  const motivation = (pref.inner_motivation || '').toLowerCase()
  const boundary = (pref.sensitivity_boundary || '').toLowerCase()

  const includesAny = (text: string, keywords: string[]) =>
    keywords.some((kw) => text.includes(kw))

  const styleHint = includesAny(style, ['szimb', 'kép']) ? 'szimbolikus'
    : includesAny(style, ['réteg']) ? 'réteges'
    : includesAny(style, ['egyszerű', 'letisztult']) ? 'egyszerű' : ''

  const lengthHint = includesAny(length, ['rövid', 'tömör']) ? 'tömör'
    : includesAny(length, ['hossz', 'kifejt']) ? 'hosszabb' : ''

  const guidanceHint = includesAny(guidance, ['irány', 'kérdés']) ? 'irányított'
    : includesAny(guidance, ['szabad', 'önálló']) ? 'szabad'
    : guidance ? 'köztes' : ''

  const motivationMap: Record<string, string> = {
    megértés: 'A felhasználó most leginkább megértésre vágyik.',
    irány: 'A felhasználó útmutatásra, irányra nyitott.',
    csend: 'A felhasználó csendes elmélyülést keres.',
    visszhang: 'A felhasználó olyan térre vágyik, ahol visszajelzést és tükröt kap.'
  }

  const motivationHint = motivationMap[motivation]
    || (motivation ? `A felhasználó ezt emelte ki: "${motivation}".` : '')

  const boundaryHint = boundary ? `Kerüld a következő érzékeny témát: "${boundary}".` : ''

  const readable: Record<string, string> = {
    szimbolikus: 'Használj képeket, szimbólumokat, metaforákat.',
    réteges: 'Törekedj rétegezett, érzékletes fogalmazásra.',
    egyszerű: 'Törekedj egyszerű, világos megfogalmazásra.',
    tömör: 'A válasz legyen lényegre törő, tömör.',
    hosszabb: 'Fejtsd ki bátran a gondolatokat részletesebben.',
    irányított: 'Vezesd új kérdésekkel is, ha elakad.',
    szabad: 'Hagyd, hogy a felhasználó vezesse a beszélgetést.',
    köztes: 'A beszélgetés ritmusát finoman, az igényekhez igazítva vezesd.'
  }

  const block = [styleHint, lengthHint, guidanceHint]
    .filter(Boolean)
    .map((k) => readable[k])
    .concat([motivationHint, boundaryHint])
    .filter(Boolean)
    .join(' ')

  return `
Te vagy a Reflecta nevű segítő naplópartner, aki ${profile.tone || 'támogató'} stílusban kíséri a felhasználót.
${profile.description || ''}
${block ? '\n\n⚙️ A válaszaidban vedd figyelembe a következő beállításokat:\n' + block : ''}
  `.trim()
}
