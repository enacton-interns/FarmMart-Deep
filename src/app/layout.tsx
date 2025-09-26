import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { NotificationProvider } from '@/context/NotificationContext'
import SWRProvider from '@/components/SWRProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Local Farmers Marketplace',
  description: 'Fresh local produce from farmers near you',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SWRProvider>
          <AuthProvider>
            <CartProvider>
              <NotificationProvider>
                <Navbar />
                <main className="flex-grow mt-[96px]">
                  {children}
                </main>
                <Footer />
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </NotificationProvider>
            </CartProvider>
          </AuthProvider>
        </SWRProvider>
      </body>
    </html>
  )
}
