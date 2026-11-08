export function formaterDistance(metres: number) {
  return metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1).replace('.', ',')} km`
}

export function formaterDuree(secondes: number) {
  const minutes = Math.max(1, Math.round(secondes / 60))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
