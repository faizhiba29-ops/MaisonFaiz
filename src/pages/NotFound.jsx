import { Link } from 'react-router'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <section className="section">
      <Seo title="Page introuvable" />
      <div className="container-site text-center">
        <p className="font-serif text-[64px] text-bordeaux">404</p>
        <h1 className="text-[28px]">Cette page est introuvable</h1>
        <p className="mt-2 text-muted">Elle n'existe pas ou plus.</p>
        <Link to="/boutique" className="btn btn-primary mt-8">Voir la boutique</Link>
      </div>
    </section>
  )
}
