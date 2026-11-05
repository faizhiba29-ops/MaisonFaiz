import { Route, Routes } from 'react-router'
import CrudPage from './CrudPage'
import * as configs from './configs'
import Dashboard from './Dashboard'
import Orders from './Orders'
import Settings from './Settings'
import Votes from './Votes'

const crud = {
  produits: configs.products,
  categories: configs.categories,
  packs: configs.packs,
  promotions: configs.promotions,
  ingredients: configs.ingredients,
  recettes: configs.recipes,
  avis: configs.reviews,
  faq: configs.faqs,
}

export default function AdminPages() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="commandes" element={<Orders />} />
      <Route path="votes" element={<Votes />} />
      <Route path="parametres" element={<Settings />} />
      {Object.entries(crud).map(([path, config]) => (
        <Route key={path} path={path} element={<CrudPage key={path} config={config} />} />
      ))}
      <Route path="*" element={<p>Page introuvable.</p>} />
    </Routes>
  )
}
