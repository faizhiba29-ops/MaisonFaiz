import { useState } from 'react'
import { Link } from 'react-router'
import Seo from '../components/Seo'
import { useSettings } from '../context/SiteData'
import { deliveryMode, deliveryPromise } from '../lib/delivery'
import { safeUrl } from '../lib/format'

// Pages légales : mentions légales, conditions de vente, confidentialité.
// Textes de base à faire valider ; les informations de l'entreprise viennent de l'admin (Paramètres).

function Page({ title, updated = 'novembre 2026', children }) {
  return (
    <section className="section">
      <Seo title={title} />
      <div className="container-site max-w-[760px]">
        <h1 className="h2">{title}</h1>
        <p className="mt-2 text-[13px] text-muted">Dernière mise à jour : {updated}</p>
        <div className="mt-10 space-y-9 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:text-[22px] [&_li]:mt-1 [&_p+p]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </section>
  )
}

const brand = (s) => s.legal_name || 'Maison Faiz foods'
const contactLine = (s) => [s.whatsapp_display && `WhatsApp ${s.whatsapp_display}`, s.legal_email].filter(Boolean).join(' · ')

export function LegalNotice() {
  const s = useSettings()
  const rows = [
    ['Nom / raison sociale', s.legal_name || 'Maison Faiz foods'],
    ['Forme juridique', s.legal_form],
    ['Adresse', s.legal_address || s.city],
    ['Registre du commerce (RC)', s.legal_rc],
    ['ICE', s.legal_ice],
    ['Identifiant fiscal (IF)', s.legal_if],
    ['Contact', contactLine(s)],
    ['Déclaration CNDP', s.legal_cndp],
  ].filter(([, v]) => v)
  return (
    <Page title="Mentions légales">
      <div>
        <h2>Éditeur du site</h2>
        <dl className="divide-y divide-line border-y border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[220px_1fr]">
              <dt className="text-muted">{k}</dt><dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h2>Hébergement</h2>
        <p>Site hébergé par Vercel Inc. (vercel.com). Données de la boutique (catalogue et commandes) hébergées par Supabase Inc. (supabase.com).</p>
      </div>
      <div>
        <h2>Propriété intellectuelle</h2>
        <p>Le nom, le logo, les textes et les photos de {brand(s)} lui appartiennent ; toute reproduction sans autorisation est interdite. Les polices Cardo, Archivo et Amiri sont utilisées sous licence SIL Open Font License 1.1.</p>
      </div>
      <p className="text-[14px]">Voir aussi : <Link to="/cgv">conditions générales de vente</Link> · <Link to="/confidentialite">confidentialité</Link>.</p>
    </Page>
  )
}

export function Terms() {
  const s = useSettings()
  const mode = deliveryMode(s)
  const hours = Number(s.claim_hours) || 48
  return (
    <Page title="Conditions générales de vente">
      <div>
        <h2>1. Objet</h2>
        <p>Ces conditions s'appliquent aux commandes passées sur ce site auprès de {brand(s)}, qui prépare et vend des produits alimentaires faits maison (granolas, sellou…). Passer commande vaut acceptation de ces conditions.</p>
      </div>
      <div>
        <h2>2. Produits et allergènes</h2>
        <p>Les produits sont préparés à la main, en petites quantités. Leur composition et les allergènes (notamment fruits à coque, arachides, sésame et gluten de l'avoine) figurent sur chaque fiche produit et sur la page <Link to="/bienfaits">Bienfaits</Link>. En cas d'allergie, contactez-nous avant de commander.</p>
        <p>Les photos sont indicatives : l'aspect peut varier légèrement d'une fournée à l'autre.</p>
      </div>
      <div>
        <h2>3. Prix</h2>
        <p>Les prix sont indiqués en dirhams (DH). Le total de votre commande est recalculé au moment de l'envoi, promotions et codes promo compris.</p>
        <p>
          {mode === 'included' && 'La livraison est incluse dans les prix affichés : aucun frais ne s\'ajoute au total.'}
          {mode === 'fixed' && `Les frais de livraison sont indiqués avant l'envoi de la commande et ajoutés au total (${deliveryPromise(s).replace('Livraison partout au Maroc : ', '')}).`}
          {mode === 'on_confirm' && 'Les frais de livraison dépendent de la ville ; ils vous sont communiqués sur WhatsApp avant l\'expédition, et vous pouvez annuler sans frais si vous ne les acceptez pas.'}
        </p>
      </div>
      <div>
        <h2>4. Commande</h2>
        <p>Vous composez votre panier, renseignez vos coordonnées puis envoyez la commande sur WhatsApp. Elle n'est définitive qu'après confirmation de notre part par message (disponibilité, total, livraison et mode de paiement).</p>
      </div>
      <div>
        <h2>5. Livraison</h2>
        <p>{deliveryPromise(s)}.{s.delivery_delay ? ` Délai indicatif : ${s.delivery_delay}.` : ''}</p>
        {s.delivery_info && <p>{s.delivery_info}</p>}
      </div>
      <div>
        <h2>6. Réclamations, retours et remboursements</h2>
        <p>Les produits alimentaires périssables ne peuvent pas être repris une fois livrés, sauf défaut de notre part.</p>
        <p>Si un colis arrive abîmé, incomplet ou ne correspond pas à votre commande, signalez-le-nous dans les {hours} heures suivant la réception, avec une photo. Après vérification, nous vous proposons un remplacement ou un remboursement du produit concerné.</p>
      </div>
      <div>
        <h2>7. Conservation</h2>
        <p>Les conseils de conservation figurent sur chaque fiche produit. Sans conservateurs, nos produits sont à consommer dans les délais indiqués.</p>
      </div>
      <div>
        <h2>8. Contact et litiges</h2>
        <p>Pour toute question : {contactLine(s) || 'via WhatsApp'}. En cas de désaccord, nous cherchons d'abord une solution amiable ; à défaut, le droit marocain s'applique, notamment la loi n° 31-08 sur la protection du consommateur.</p>
      </div>
    </Page>
  )
}

const LOCAL_KEYS = ['gbh-cart-v1', 'gbh-customer', 'gbh-vote', 'gbh-voter']

export function Privacy() {
  const s = useSettings()
  const [cleared, setCleared] = useState(false)
  const clearDevice = () => {
    try { LOCAL_KEYS.forEach((k) => localStorage.removeItem(k)) } catch { /* stockage indisponible */ }
    setCleared(true)
    setTimeout(() => window.location.reload(), 1200)
  }
  return (
    <Page title="Politique de confidentialité">
      <div>
        <h2>Responsable</h2>
        <p>{brand(s)}{s.legal_address ? `, ${s.legal_address}` : ''}. Contact : {contactLine(s) || 'via WhatsApp'}.{s.legal_cndp ? ` Traitement déclaré à la CNDP sous le n° ${s.legal_cndp}.` : ''}</p>
      </div>
      <div>
        <h2>Données collectées et utilisation</h2>
        <p>Lorsque vous commandez, nous enregistrons votre nom, téléphone, ville, adresse, votre remarque éventuelle et le contenu de la commande. Ces données servent uniquement à :</p>
        <ul>
          <li>préparer, confirmer et livrer votre commande ;</li>
          <li>vous contacter à son sujet sur WhatsApp ;</li>
          <li>tenir notre comptabilité.</li>
        </ul>
        <p>Nous ne faisons ni publicité ciblée, ni revente, ni suivi de navigation, et nous n'utilisons aucun outil de statistiques.</p>
      </div>
      <div>
        <h2>Qui y a accès</h2>
        <ul>
          <li>{brand(s)}, pour traiter la commande ;</li>
          <li>le transporteur, pour la livraison (nom, téléphone, adresse, montant à encaisser) ;</li>
          <li>nos prestataires techniques : Supabase (base de données) et Vercel (hébergement du site) ;</li>
          <li>WhatsApp (Meta), lorsque vous nous envoyez votre commande ou un message.</li>
        </ul>
      </div>
      <div>
        <h2>Durée de conservation</h2>
        <p>Les commandes sont conservées le temps nécessaire à leur suivi et à nos obligations légales (comptabilité), puis supprimées.</p>
      </div>
      <div>
        <h2>Cookies et stockage sur votre appareil</h2>
        <p>Ce site ne dépose aucun cookie publicitaire ou de mesure d'audience ; c'est pourquoi aucun bandeau de consentement ne s'affiche. Il garde seulement sur votre appareil :</p>
        <ul>
          <li>votre panier ;</li>
          <li>vos coordonnées, uniquement si vous cochez « Se souvenir de mes coordonnées » ;</li>
          <li>un identifiant anonyme pour le sondage des goûts (un vote par appareil).</li>
        </ul>
        <p>Les polices sont hébergées sur le site. Les vidéos Instagram ne sont chargées que si vous cliquez sur « Voir nos vidéos Instagram » : Instagram (Meta) peut alors déposer ses propres cookies.</p>
        <div className="mt-4">
          <button className="btn btn-outline" onClick={clearDevice} disabled={cleared}>
            {cleared ? 'Données effacées' : 'Effacer les données enregistrées sur cet appareil'}
          </button>
        </div>
      </div>
      <div>
        <h2>Vos droits</h2>
        <p>Conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, vous pouvez accéder à vos données, les faire rectifier ou supprimer, et vous opposer à leur traitement. Écrivez-nous ({contactLine(s) || 'via WhatsApp'}) : nous répondons dans les meilleurs délais.</p>
        <p>Vous pouvez aussi saisir la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP, <a href={safeUrl('https://www.cndp.ma')} target="_blank" rel="noreferrer">www.cndp.ma</a>).</p>
      </div>
    </Page>
  )
}
