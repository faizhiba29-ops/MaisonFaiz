import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import Layout, { Loading } from './components/Layout'
import { CartProvider } from './context/Cart'
import { SiteDataProvider } from './context/SiteData'
import { isConfigured, keyProblem } from './lib/supabase'
import Benefits from './pages/Benefits'
import Cart from './pages/Cart'
import Home from './pages/Home'
import { LegalNotice, Privacy, Terms } from './pages/Legal'
import { Contact, Faq } from './pages/Info'
import NotFound from './pages/NotFound'
import Product from './pages/Product'
import Recipes from './pages/Recipes'
import Shop from './pages/Shop'

// L'admin est chargé à part : les visiteurs ne téléchargent pas son code.
const AdminApp = lazy(() => import('./admin/AdminApp'))
const AdminPages = lazy(() => import('./admin/pages'))

function SetupNeeded() {
  return (
    <div className="container-site max-w-[720px] py-24">
      <h1 className="text-[28px]">Configuration requise</h1>
      {keyProblem === 'url' ? (
        <p className="mt-3 border border-bordeaux p-4 text-bordeaux">
          <code>VITE_SUPABASE_URL</code> doit être l'adresse de l'API, au format{' '}
          <code>https://xxxx.supabase.co</code> — jamais une adresse <code>postgresql://</code> (elle contient le mot de
          passe de la base).
        </p>
      ) : keyProblem === 'secret' ? (
        <p className="mt-3 border border-bordeaux p-4 text-bordeaux">
          La clé dans <code>.env</code> est une clé <strong>secrète</strong> (<code>sb_secret_…</code>). Supabase la refuse dans
          un navigateur, et elle ne doit jamais être dans le site. Remplacez-la par la clé <strong>publishable</strong>{' '}
          (<code>sb_publishable_…</code>).
        </p>
      ) : (
        <p className="mt-3">
          Renseignez <code>VITE_SUPABASE_ANON_KEY</code> dans <code>.env</code> avec la clé <strong>publishable</strong>{' '}
          (<code>sb_publishable_…</code>).
        </p>
      )}
      <p className="mt-4">
        Où la trouver : Supabase → Project Settings → <strong>API Keys</strong> → section « Publishable key » → copier.
        Enregistrez <code>.env</code>, la page se recharge toute seule.
      </p>
    </div>
  )
}

export default function App() {
  if (!isConfigured) return <SetupNeeded />
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<AdminPages />} />
            <Route path="*" element={<AdminPages />} />
          </Route>
          <Route
            element={
              <SiteDataProvider>
                <CartProvider>
                  <Layout />
                </CartProvider>
              </SiteDataProvider>
            }
          >
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="boutique/:category" element={<Shop />} />
            <Route path="granolas" element={<Navigate to="/boutique/granola" replace />} />
            <Route path="produits/:slug" element={<Product />} />
            <Route path="bienfaits" element={<Benefits />} />
            <Route path="comment-le-deguster" element={<Recipes />} />
            <Route path="faq" element={<Faq />} />
            <Route path="contact" element={<Contact />} />
            <Route path="panier" element={<Cart />} />
            <Route path="mentions-legales" element={<LegalNotice />} />
            <Route path="cgv" element={<Terms />} />
            <Route path="confidentialite" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
