export type LeafletMapMarker = {
  id: string
  title: string
  latitude: number
  longitude: number
  order: number
  dayLabel?: string
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
        width: 30px;
        height: 30px;
        border-radius: 999px;
        background: ${primaryColor};
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 800 13px/1 system-ui, -apple-system, sans-serif;
        border: 2px solid #fff;
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.28);
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

      const iconFor = (order) => L.divIcon({
        className: '',
        html: '<div class="trip-marker">' + order + '</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const placed = [];
      markers.forEach((marker) => {
        const point = L.marker([marker.latitude, marker.longitude], {
          icon: iconFor(marker.order)
        }).addTo(map);
        const subtitle = marker.dayLabel ? '<br/><span style="opacity:.75;font-size:12px">' + marker.dayLabel + '</span>' : '';
        point.bindPopup('<strong>' + marker.title + '</strong>' + subtitle);
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
