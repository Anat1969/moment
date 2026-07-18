export interface Fix { lat: number; lng: number; accuracy: number }

export function locate(): Promise<Fix> {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('אין גישה למיקום'))
    navigator.geolocation.getCurrentPosition(
      p => res({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      e => rej(e),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  })
}

// שם המקום — Nominatim של OpenStreetMap, חינמי וללא מפתח.
// מחזיר שם בעברית אם קיים, ואת השם הלועזי לצידו.
export async function placeName(lat: number, lng: number): Promise<string | null> {
  try {
    const u = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=he,en&zoom=17`
    const r = await fetch(u, { headers: { 'Accept': 'application/json' } })
    if (!r.ok) return null
    const j = await r.json()
    const a = j.address || {}
    const parts = [
      j.name || a.tourism || a.attraction || a.building || a.road,
      a.neighbourhood || a.suburb,
      a.city || a.town || a.village || a.county
    ].filter(Boolean)
    const seen = new Set<string>()
    const uniq = parts.filter((p: string) => !seen.has(p) && seen.add(p))
    return uniq.slice(0, 3).join(', ') || j.display_name || null
  } catch { return null }
}
