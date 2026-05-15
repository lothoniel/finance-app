import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import i18n from './lib/i18n'
import { useStore } from './store'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CashFlow from './pages/CashFlow'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import DebtPayment from './pages/DebtPayment'
import MortgagePage from './pages/Mortgage'
import Portfolio from './pages/Portfolio'
import SharedBalance from './pages/SharedBalance'
import SharedBalanceView from './pages/SharedBalanceView'
import Settings from './pages/Settings'
import NetWorth from './pages/NetWorth'
import Reports from './pages/Reports'
import Budget from './pages/Budget'
import Transactions from './pages/Transactions'

export default function App() {
  const theme = useStore((s) => s.settings.theme)
  const language = useStore((s) => s.settings.language)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [language])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="cash-flow" element={<CashFlow />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="debt" element={<DebtPayment />} />
          <Route path="mortgage" element={<MortgagePage />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="shared-balance" element={<SharedBalance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="net-worth" element={<NetWorth />} />
          <Route path="reports" element={<Reports />} />
          <Route path="budget" element={<Budget />} />
          <Route path="transactions" element={<Transactions />} />
        </Route>
        <Route path="/shared-balance/view" element={<SharedBalanceView />} />
      </Routes>
    </BrowserRouter>
  )
}
