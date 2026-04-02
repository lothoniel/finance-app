import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CashFlow from './pages/CashFlow'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import DebtPayment from './pages/DebtPayment'
import Portfolio from './pages/Portfolio'
import SharedBalance from './pages/SharedBalance'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="debt" element={<DebtPayment />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="shared-balance" element={<SharedBalance />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
