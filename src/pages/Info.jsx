import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, InstagramIcon, PinIcon, TruckIcon, WhatsAppIcon } from '../components/Icons'
import { Loading } from '../components/Layout'
import Seo from '../components/Seo'
import { useSettings } from '../context/SiteData'
import { supabase } from '../lib/supabase'
import { waLink } from '../lib/whatsapp'

export function Faq() {
  const s = useSettings()
  const [faqs, setFaqs] = useState(null)

  useEffect(() => {
    supabase.from('faqs').select('*').order('sort_order').order('created_at')
      .then(({ data }) => setFaqs(data || []))
  }, [])

  return (
    <>
      <Seo title="Questions fréquentes" description="Livraison, prix, ingrédients, conservation, allergènes : toutes les réponses sur nos granolas faits maison." />
      <section className="section">
        <div className="container-site max-w-[760px]">
          <h1 className="section-title">Questions fréquentes</h1>
          <p className="section-sub mt-2">Une autre question ? Écrivez-nous sur WhatsApp.</p>
          {!faqs ? <Loading /> : (
            <div className="border-t border-line">
              {faqs.map((f) => (
                <details key={f.id} className="group border-b border-line">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-serif text-[18px] text-ink md:text-[20px] [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="whitespace-pre-line pb-5">{f.answer}</p>
                </details>
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <a href={waLink(s.whatsapp_number, 'Salam Hiba, j\'ai une question : ')} target="_blank" rel="noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon width={18} height={18} /> Poser ma question
            </a>
          </div>
        </div>
      </section>
    </>
  )
}

export function Contact() {
  const s = useSettings()
  const cards = [
    {
      icon: <WhatsAppIcon width={26} height={26} />,
      title: 'WhatsApp',
      text: s.whatsapp_display || s.whatsapp_number,
      href: waLink(s.whatsapp_number, 'Salam Hiba, '),
      cta: 'Écrire sur WhatsApp',
    },
    {
      icon: <InstagramIcon width={26} height={26} />,
      title: 'Instagram',
      text: `@${s.instagram_handle}`,
      href: s.instagram_url,
      cta: 'Voir le compte',
    },
  ]
  return (
    <>
      <Seo title="Contact" description="Commandez ou posez vos questions sur WhatsApp. Granola fait maison à Fès, livraison partout au Maroc." />
      <section className="section">
        <div className="container-site max-w-[900px]">
          <h1 className="section-title">Contact</h1>
          <p className="section-sub mt-2">Une commande, une question, une idée de goût ? Hiba vous répond personnellement.</p>

          <div className="grid gap-2 sm:grid-cols-2">
            {cards.map((c) => (
              <a key={c.title} href={c.href} target="_blank" rel="noreferrer" className="group flex flex-col items-center bg-creme p-8 text-center">
                <span className="text-bordeaux">{c.icon}</span>
                <h2 className="mt-3 text-[24px]">{c.title}</h2>
                <p className="text-ink">{c.text}</p>
                <span className="link-underline mt-4 text-[13px] uppercase tracking-widest text-ink group-hover:bg-[length:100%_1px]">{c.cta}</span>
              </a>
            ))}
          </div>

          <div className="mt-10 grid gap-6 border-t border-line pt-10 sm:grid-cols-2">
            <div className="flex gap-4">
              <TruckIcon className="shrink-0 text-bordeaux" />
              <div>
                <h3 className="text-[20px]">Livraison partout au Maroc</h3>
                {s.delivery_delay && <p className="mt-1">Délai : {s.delivery_delay}</p>}
                {s.delivery_info && <p className="mt-1 text-[14px]">{s.delivery_info}</p>}
              </div>
            </div>
            <div className="flex gap-4">
              <PinIcon className="shrink-0 text-bordeaux" />
              <div>
                <h3 className="text-[20px]">Basée à {s.city || 'Fès'}</h3>
                <p className="mt-1 text-[14px]">Préparation à la maison en petites fournées, sur commande.</p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-center">
            <Link to="/faq" className="btn btn-outline">Voir les questions fréquentes</Link>
          </p>
        </div>
      </section>
    </>
  )
}
