import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Capture } from '../lib/types'
import { publicUrl } from '../lib/supabase'
import { hhmm, tripDay } from '../lib/trip'

const COLORS: Record<string, string> = {
  'תרבות': '#1E3A5F',
  'טבע': '#6B7F5C',
  'אוכל': '#C2452D',
  'קנייה': '#8A5B8C',
  'ספורט': '#B07A20',
  'סתם': '#8A9299'
}

export default function MapView({ items }: { items: Capture[] }) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const layer = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!el.current || map.current) return
    map.current = L.map(el.current, { zoomControl: true }).setView([35.0, 135.76], 6)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap', maxZoom: 19
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)
  }, [])

  useEffect(() => {
    if (!map.current || !layer.current) return
    layer.current.clearLayers()
    const pts = items.filter(i => i.lat != null && i.lng != null)
    const latlngs: L.LatLngExpression[] = []

    pts.forEach(i => {
      const color = COLORS[i.tags?.[0] || 'סתם'] || COLORS['סתם']
      const ll: L.LatLngExpression = [i.lat!, i.lng!]
      latlngs.push(ll)
      const img = i._localUrl || publicUrl(i.image_path)
      const m = L.circleMarker(ll, {
        radius: 8, color: '#FBFAF6', weight: 2, fillColor: color, fillOpacity: 1
      })
      m.bindPopup(
        `<div style="direction:rtl;font-family:Heebo,sans-serif;max-width:200px">
          ${img ? `<img src="${img}" style="width:100%;border-radius:2px;margin-bottom:6px" />` : ''}
          <div style="font-size:13px;line-height:1.5">${(i.transcript || i.note || '').slice(0, 140)}</div>
          <div style="font-size:11px;color:#8A9299;margin-top:5px">יום ${tripDay(i.taken_at)} · ${hhmm(i.taken_at)} · ${i.author}</div>
        </div>`
      )
      m.addTo(layer.current!)
    })

    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: '#1E3A5F', weight: 1.5, opacity: .5, dashArray: '4 5' }).addTo(layer.current)
    }
    if (latlngs.length) map.current.fitBounds(L.latLngBounds(latlngs as any), { padding: [40, 40], maxZoom: 15 })
  }, [items])

  return <div id="map" ref={el} />
}
