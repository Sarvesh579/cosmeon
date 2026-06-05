export function distance(a, b) {
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLon = (b.lon - a.lon) * Math.PI / 180

  const lat1 = a.lat * Math.PI / 180
  const lat2 = b.lat * Math.PI / 180

  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)

  const term_a =
    sinLat*sinLat +
    Math.cos(lat1) *
    Math.cos(lat2) *
    sinLon*sinLon

  return 6371 * 2 * Math.atan2(
    Math.sqrt(term_a),
    Math.sqrt(1-term_a)
  )                //in kilometres
}