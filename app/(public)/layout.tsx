import { WhatsAppFloat } from '@/components/public/WhatsAppFloat'
import { SiteHeader } from '@/components/public/SiteHeader'
import { SiteFooter } from '@/components/public/SiteFooter'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />

      <main>{children}</main>

      <SiteFooter />

      {/* WhatsApp floating button */}
      <WhatsAppFloat />
    </>
  )
}
