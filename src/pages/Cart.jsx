import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from '../components/Icons'
import { packContents, ProductVisual, Visual } from '../components/Product'
import Seo from '../components/Seo'
import { useCart } from '../context/Cart'
import { useSiteData } from '../context/SiteData'
import { formatDH } from '../lib/format'
import { supabase } from '../lib/supabase'
import { buildOrderMessage, waLink } from '../lib/whatsapp'

const CUSTOMER_KEY = 'gbh-customer'
const EMPTY = { name: '', phone: '', city: '', address: '', note: '' }

function loadCustomer() {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '{}'), note: '' }
  } catch {
    return EMPTY
  }
}

const sameLine = (item, line) => item.type === line.type && item.id === line.id && (item.weight || null) === (line.weight || null)

function validate(f) {
  const e = {}
  if (!f.name.trim()) e.name = 'Votre nom'
  if (f.phone.replace(/\D/g, '').length < 9) e.phone = 'Un numéro valide (ex. 06 12 34 56 78)'
  if (!f.city.trim()) e.city = 'Votre ville'
  if (!f.address.trim()) e.address = 'Votre adresse de livraison'
  return e
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[13px] text-bordeaux">{error}</span>}
    </label>
  )
}

export default function Cart() {
  const { items, code, setQty, remove, setCode, clear } = useCart()
  const { products, packs, settings } = useSiteData()
  const [quote, setQuote] = useState(null)
  const [quoteError, setQuoteError] = useState(false)
  const [codeInput, setCodeInput] = useState(code)
  const [form, setForm] = useState(loadCustomer)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [sent, setSent] = useState(null)

  // Devis recalculé par le serveur à chaque changement du panier ou du code promo
  useEffect(() => {
    if (!items.length) {
      setQuote(null)
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      const { data, error } = await supabase.rpc('quote_cart', { p_items: items, p_code: code || null })
      if (cancelled) return
      setQuoteError(Boolean(error))
      if (!error) setQuote(data)
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [items, code])

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const send = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.querySelector('[data-checkout]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    try {
      const { name, phone, city, address } = form
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, city, address }))
    } catch { /* ignore */ }

    setSending(true)
    setSendError(null)
    const { data, error } = await supabase.rpc('place_order', { p_items: items, p_code: code || null, p_customer: form })
    setSending(false)

    if (error) {
      const network = !error.code || /fetch|network/i.test(error.message)
      setSendError({
        message: network ? "La connexion a échoué, mais vous pouvez envoyer votre commande directement sur WhatsApp." : error.message,
        fallback: network && quote ? waLink(settings.whatsapp_number, buildOrderMessage(quote, form)) : null,
      })
      return
    }

    const url = waLink(settings.whatsapp_number, buildOrderMessage(data, form, data.order_number))
    setSent({ url, number: data.order_number })
    clear()
    window.location.href = url
  }

  if (sent) {
    return (
      <section className="section">
        <Seo title="Commande envoyée" />
        <div className="container-site max-w-[560px] text-center">
          <h1 className="text-[32px]">Merci, commande n°{sent.number} !</h1>
          <p className="mt-3">
            WhatsApp va s'ouvrir avec votre commande pré-remplie : il ne reste qu'à appuyer sur <strong>Envoyer</strong>.
            Hiba vous confirme la livraison très vite.
          </p>
          <a href={sent.url} className="btn btn-whatsapp mt-8 w-full sm:w-auto">
            <WhatsAppIcon width={18} height={18} /> Ouvrir WhatsApp
          </a>
          <p className="mt-6"><Link to="/" className="link-underline text-ink">Retour à l'accueil</Link></p>
        </div>
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="section">
        <Seo title="Panier" />
        <div className="container-site text-center">
          <h1 className="section-title">Votre panier est vide</h1>
          <p className="section-sub mt-2">Découvrez nos granolas faits maison.</p>
          <Link to="/granolas" className="btn btn-primary">Voir les granolas</Link>
        </div>
      </section>
    )
  }

  const rows = items.map((item) => {
    const info = item.type === 'pack' ? packs.find((p) => p.id === item.id) : products.find((p) => p.id === item.id)
    const line = quote?.lines.find((l) => sameLine(item, l))
    return { item, info, line, unavailable: Boolean(quote) && !line }
  })
  const codeStatus = quote?.code?.status

  return (
    <>
      <Seo title="Panier" />
      <section className="section pt-8 md:pt-12">
        <div className="container-site">
          <h1 className="section-title mb-8 md:mb-12">Votre panier</h1>
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:gap-16">
            {/* Articles */}
            <div>
              <ul className="divide-y divide-line border-y border-line">
                {rows.map(({ item, info, line, unavailable }) => (
                  <li key={`${item.type}-${item.id}-${item.weight}`} className="flex gap-4 py-4">
                    <div className="w-[84px] shrink-0 md:w-[110px]">
                      {item.type === 'pack'
                        ? <Visual image={info?.image} themeName={info?.theme} name={info?.name || 'Pack'} art="duo" />
                        : info ? <ProductVisual product={info} overlay={false} /> : <div className="aspect-square bg-creme" />}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-serif text-[18px] leading-tight text-ink">{info?.name || line?.name || 'Article'}</p>
                          <p className="text-[13px] text-muted">
                            {item.type === 'pack' ? packContents(info || {}, products).join(' + ') : item.weight}
                          </p>
                        </div>
                        <button onClick={() => remove(item)} className="p-1 text-muted hover:text-bordeaux" aria-label="Retirer"><TrashIcon width={18} /></button>
                      </div>
                      {unavailable ? (
                        <p className="mt-2 text-[13px] text-bordeaux">Cet article n'est plus disponible — il ne sera pas commandé.</p>
                      ) : (
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <div className="flex items-center border border-line text-ink">
                            <button className="p-2" onClick={() => setQty(item, item.qty - 1)} aria-label="Diminuer"><MinusIcon width={14} /></button>
                            <span className="w-7 text-center text-[14px] tabular-nums">{item.qty}</span>
                            <button className="p-2" onClick={() => setQty(item, item.qty + 1)} aria-label="Augmenter"><PlusIcon width={14} /></button>
                          </div>
                          {line && (
                            <span className="price text-right">
                              {line.base_price > line.unit_price && <s className="mr-2 text-muted">{formatDH(line.base_price * line.qty)}</s>}
                              {formatDH(line.line_total)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Link to="/granolas" className="link-underline mt-4 inline-block text-[14px] text-ink">← Continuer mes achats</Link>
            </div>

            {/* Récap + formulaire */}
            <div data-checkout className="scroll-mt-24">
              <div className="bg-creme-light p-5 md:p-6">
                <form
                  onSubmit={(e) => { e.preventDefault(); setCode(codeInput.trim()) }}
                  className="flex gap-2"
                >
                  <input className="input uppercase" placeholder="Code promo" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} aria-label="Code promo" />
                  <button className="btn btn-outline shrink-0 px-4" type="submit">Appliquer</button>
                </form>
                {code && (
                  <p className={`mt-2 text-[13px] ${codeStatus === 'ok' ? 'text-green-700' : 'text-bordeaux'}`}>
                    {codeStatus === 'ok' && `Code ${quote.code.code} appliqué (${quote.code.label})`}
                    {codeStatus === 'invalid' && 'Ce code est invalide ou a expiré.'}
                    {codeStatus === 'not_applicable' && "Ce code ne s'applique pas aux articles de votre panier."}{' '}
                    <button className="underline" onClick={() => { setCode(''); setCodeInput('') }}>Retirer</button>
                  </p>
                )}

                <dl className="mt-5 space-y-2 text-[15px]">
                  <div className="flex justify-between"><dt>Sous-total</dt><dd className="price">{quote ? formatDH(quote.subtotal) : '…'}</dd></div>
                  {quote && Number(quote.discount) > 0 && (
                    <div className="flex justify-between text-bordeaux"><dt>Code promo</dt><dd className="price !text-bordeaux">-{formatDH(quote.discount)}</dd></div>
                  )}
                  <div className="flex justify-between">
                    <dt>Livraison</dt>
                    <dd className="text-right text-[14px]">{quote && Number(quote.delivery_fee) > 0 ? <span className="price">{formatDH(quote.delivery_fee)}</span> : 'Confirmée sur WhatsApp'}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-3 text-[17px] text-ink">
                    <dt>Total</dt><dd className="price !text-[17px]">{quote ? formatDH(quote.total) : '…'}</dd>
                  </div>
                </dl>
                {settings.delivery_info && <p className="mt-3 text-[13px] text-muted">{settings.delivery_info}</p>}
                {quoteError && <p className="mt-3 text-[13px] text-bordeaux">Impossible de calculer le total pour le moment.</p>}
              </div>

              <form onSubmit={send} noValidate className="mt-6 space-y-4">
                <h2 className="text-[24px]">Vos coordonnées</h2>
                <Field label="Nom et prénom *" error={errors.name}>
                  <input className="input" autoComplete="name" value={form.name} onChange={update('name')} />
                </Field>
                <Field label="Téléphone *" error={errors.phone}>
                  <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 …" value={form.phone} onChange={update('phone')} />
                </Field>
                <Field label="Ville *" error={errors.city}>
                  <input className="input" autoComplete="address-level2" placeholder="Fès, Casablanca, Rabat…" value={form.city} onChange={update('city')} />
                </Field>
                <Field label="Adresse *" error={errors.address}>
                  <input className="input" autoComplete="street-address" value={form.address} onChange={update('address')} />
                </Field>
                <Field label="Remarque">
                  <textarea className="input min-h-[88px]" placeholder="Sans miel, créneau de livraison, cadeau…" value={form.note} onChange={update('note')} />
                </Field>

                {sendError && (
                  <div className="border border-bordeaux p-4 text-[14px] text-bordeaux">
                    <p>{sendError.message}</p>
                    {sendError.fallback && (
                      <a href={sendError.fallback} className="mt-2 inline-block underline">Envoyer quand même sur WhatsApp</a>
                    )}
                  </div>
                )}

                <button type="submit" className="btn btn-whatsapp w-full" disabled={sending || !quote?.lines.length}>
                  <WhatsAppIcon width={18} height={18} />
                  {sending ? 'Envoi…' : 'Envoyer ma commande sur WhatsApp'}
                </button>
                <p className="text-center text-[12px] text-muted">
                  Votre commande s'ouvre dans WhatsApp, prête à être envoyée. Hiba vous confirme tout par message.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
