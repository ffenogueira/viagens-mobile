const API_URL = 'https://api-viagens.upyouridea.com.br/v1'

export function buildMapTileUrl(zoom: number, x: number, y: number) {
  return `${API_URL}/map/tiles/${zoom}/${x}/${y}.png`
}
