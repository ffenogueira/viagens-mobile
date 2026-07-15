export type LeafletMapMarker = {
  id: string
  title: string
  latitude: number
  longitude: number
  order: number
  dayLabel?: string
  address?: string | null
  description?: string | null
  photoUrl?: string | null
  timeLabel?: string | null
  category?: string | null
  ratingLabel?: string | null
  distanceLabel?: string | null
}

type BuildLeafletMapHtmlOptions = {
  markers: LeafletMapMarker[]
  interactive?: boolean
  primaryColor?: string
}

export function buildLeafletMapHtml({
  markers,
  interactive = true,
  primaryColor = '#7B4DFF'
}: BuildLeafletMapHtmlOptions) {
  const payload = JSON.stringify(markers)
  const zoomControl = interactive ? 'true' : 'false'
  const dragging = interactive ? 'true' : 'false'
  const scrollWheelZoom = interactive ? 'true' : 'false'
  const touchZoom = interactive ? 'true' : 'false'
  const doubleClickZoom = interactive ? 'true' : 'false'

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #eef2ff; }
      .leaflet-control-attribution { font-size: 9px; }
      .trip-marker {
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: ${primaryColor};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 900 14px/1 system-ui, -apple-system, sans-serif;
        border: 3px solid #fff;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
      }
      .trip-popup {
        width: 230px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .trip-popup img {
        width: 100%;
        height: 104px;
        object-fit: cover;
        border-radius: 16px;
        margin-bottom: 10px;
      }
      .trip-popup strong {
        display: block;
        color: #111827;
        font-size: 15px;
        line-height: 19px;
        margin-bottom: 4px;
      }
      .trip-popup .meta {
        color: #64748B;
        font-size: 12px;
        line-height: 17px;
        margin-top: 3px;
      }
      .trip-popup .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 9px;
      }
      .trip-popup .chip {
        border-radius: 999px;
        background: #F3E8FF;
        color: ${primaryColor};
        font-size: 11px;
        font-weight: 800;
        padding: 5px 8px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const markers = ${payload};
      const map = L.map('map', {
        zoomControl: ${zoomControl},
        attributionControl: true,
        dragging: ${dragging},
        scrollWheelZoom: ${scrollWheelZoom},
        touchZoom: ${touchZoom},
        doubleClickZoom: ${doubleClickZoom},
        boxZoom: ${interactive},
        keyboard: ${interactive}
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const iconFor = (order) => L.divIcon({
        className: '',
        html: '<div class="trip-marker">' + order + '</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const placed = [];
      markers.forEach((marker) => {
        const point = L.marker([marker.latitude, marker.longitude], {
          icon: iconFor(marker.order)
        }).addTo(map);
        const image = marker.photoUrl ? '<img src="' + escapeHtml(marker.photoUrl) + '" />' : '';
        const address = marker.address ? '<div class="meta">📍 ' + escapeHtml(marker.address) + '</div>' : '';
        const day = marker.dayLabel ? '<div class="meta">🗓 ' + escapeHtml(marker.dayLabel) + '</div>' : '';
        const description = marker.description ? '<div class="meta">' + escapeHtml(marker.description) + '</div>' : '';
        const chips = [
          marker.timeLabel ? '🕒 ' + marker.timeLabel : '',
          marker.ratingLabel ? '⭐ ' + marker.ratingLabel : '',
          marker.distanceLabel ? '↔ ' + marker.distanceLabel : '',
          marker.category || ''
        ].filter(Boolean).map((chip) => '<span class="chip">' + escapeHtml(chip) + '</span>').join('');
        point.bindPopup(
          '<div class="trip-popup">' +
            image +
            '<strong>' + escapeHtml(marker.title) + '</strong>' +
            address +
            day +
            description +
            (chips ? '<div class="chips">' + chips + '</div>' : '') +
          '</div>',
          { maxWidth: 260 }
        );
        placed.push(point);
      });

      if (markers.length === 1) {
        map.setView([markers[0].latitude, markers[0].longitude], 13);
      } else if (markers.length > 1) {
        map.fitBounds(L.featureGroup(placed).getBounds().pad(0.22));
      } else {
        map.setView([0, 0], 2);
      }
    </script>
  </body>
</html>`
}
