import { Route, Routes } from 'react-router-dom'
import { Home } from '@/pages/Home'
import { ThemePanel } from '@/components/ThemePanel'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <ThemePanel />
    </>
  )
}
