import { ICONES } from '~/constants/icones.constants'

export function Icone({ nom, className }: { nom: keyof typeof ICONES; className?: string }) {
  return <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: ICONES[nom] }} />
}
