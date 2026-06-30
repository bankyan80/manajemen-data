'use client'

import { useState, useEffect, useRef } from 'react'
import { Layers } from 'lucide-react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'
import { safeFetch } from '@/lib/safe-fetch'

interface FeatureGeometry {
  coordinates: [number, number]
}

interface FeatureProperties {
  nama: string
  npsn: string
  jenjang: string
  status: string
  markerColor?: string
  teacherCount: number
  studentCount: number
  ratio: number
  healthScore: number
  [key: string]: unknown
}

interface Feature {
  geometry: FeatureGeometry
  properties: FeatureProperties
}

const LAYERS = [
  { id: 'teacher_shortage', label: 'Kekurangan Guru', color: '#EF4444' },
  { id: 'certification', label: 'Sertifikasi', color: '#F59E0B' },
  { id: 'student_density', label: 'Kepadatan Siswa', color: '#8B5CF6' },
  { id: 'retirement', label: 'Risiko Pensiun', color: '#EF4444' },
]

export default function GisClient() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<LayerGroup | null>(null)
  const [activeLayer, setActiveLayer] = useState('teacher_shortage')
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchool, setSelectedSchool] = useState<FeatureProperties | null>(null)

  useEffect(() => {
    async function loadMap() {
      try {
        const result = await safeFetch<{ features: Feature[] }>(`/api/v2/gis/schools?layer=${activeLayer}`)
        setFeatures(result.features || [])
      } catch (err) {
        console.error('Failed to load GIS data', err)
      } finally {
        setLoading(false)
      }
    }
    loadMap()
  }, [activeLayer])

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    async function initMap() {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current!, {
          center: [-7.0, 108.5],
          zoom: 12,
          zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current)
      }

      const map = mapInstanceRef.current

      if (markersRef.current && map) {
        map.removeLayer(markersRef.current)
      }

      const markerLayer = L.layerGroup()

      features.forEach((feature) => {
        const { geometry, properties } = feature

        const marker = L.circleMarker([geometry.coordinates[1], geometry.coordinates[0]], {
          radius: 10,
          fillColor: properties.markerColor || '#10B981',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        })

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px;">${properties.nama}</h3>
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              ${properties.jenjang.toUpperCase()} • ${properties.status}
            </p>
            <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <div style="font-size: 12px; color: #475569;">
              <div>👥 Guru: ${properties.teacherCount}</div>
              <div>🎓 Siswa: ${properties.studentCount}</div>
              <div>📊 Rasio: ${properties.ratio}</div>
              ${properties.healthScore ? `<div>🏥 Skor: ${properties.healthScore}</div>` : ''}
            </div>
          </div>
        `)

        marker.on('click', () => {
          setSelectedSchool(properties)
        })

        markerLayer.addLayer(marker)
      })

      if (map) {
        markerLayer.addTo(map)
      }
      markersRef.current = markerLayer

      if (features.length > 0 && map) {
        const group = L.featureGroup(
          features.map((f) =>
            L.circleMarker([f.geometry.coordinates[1], f.geometry.coordinates[0]])
          )
        )
        map.fitBounds(group.getBounds(), { padding: [50, 50] })
      }
    }

    if (features.length > 0) {
      initMap()
    }
  }, [features])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">GIS Education Map</h1>
          <p className="page-subtitle">Peta interaktif pendidikan Kecamatan Lemahabang</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-64 flex-shrink-0">
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Layer
            </h3>
            <div className="space-y-2">
              {LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeLayer === layer.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                  {layer.label}
                </button>
              ))}
            </div>

            <hr className="my-4 border-border" />

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Sehat
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Warning
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Kritis
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Surplus
              </div>
            </div>
          </div>

          {selectedSchool && (
            <div className="card p-4 mt-4 animate-in">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">{selectedSchool.nama}</h3>
              <div className="text-xs text-slate-500 space-y-1">
                <p>NPSN: {selectedSchool.npsn}</p>
                <p>Jenjang: {selectedSchool.jenjang?.toUpperCase()}</p>
                <p>Guru: {selectedSchool.teacherCount}</p>
                <p>Siswa: {selectedSchool.studentCount}</p>
                {selectedSchool.healthScore > 0 && (
                  <p>Health Score: {selectedSchool.healthScore}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="card overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Memuat peta...
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
