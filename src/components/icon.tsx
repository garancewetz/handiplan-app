import { ICONS } from '~/constants/icons.constants'

export function Icon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: ICONS[name] }} />
}
