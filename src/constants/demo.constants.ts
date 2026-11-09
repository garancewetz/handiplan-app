/** Mode démo (adresse se terminant par ?demo) : vraies données OSM du centre de Paris, enregistrées. */
export const DEMO_MODE = new URLSearchParams(window.location.search).has('demo')
