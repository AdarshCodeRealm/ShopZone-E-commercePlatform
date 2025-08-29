import React, { useState } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import Header from '@/components/Header'
import ProductGrid from '@/components/ProductGrid'
import Cart from '@/components/Cart'
import ProductDetail from '@/components/ProductDetail'
import Login from '@/components/Login'
import Signup from '@/components/Signup'
import ForgotPassword from '@/components/ForgotPassword'
import UserProfile from '@/components/UserProfile'
import MyOrders from '@/components/MyOrders'
import OrderHistory from '@/components/OrderHistory'
import './index.css'

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [authModal, setAuthModal] = useState(null) // 'login', 'signup', 'forgot', or null
  const [currentView, setCurrentView] = useState('home') // 'home', 'profile', 'orders', 'history'

  const handleCartClick = () => {
    setIsCartOpen(true)
  }

  const handleLoginClick = () => {
    setAuthModal('login')
  }

  const handleProfileClick = () => {
    setCurrentView('profile')
  }

  const handleOrdersClick = () => {
    setCurrentView('orders')
  }

  const handleHistoryClick = () => {
    setCurrentView('history')
  }

  const handleBackToHome = () => {
    setCurrentView('home')
  }

  const handleCloseAuthModal = () => {
    setAuthModal(null)
  }

  const handleSwitchToSignup = () => {
    setAuthModal('signup')
  }

  const handleSwitchToLogin = () => {
    setAuthModal('login')
  }

  const handleSwitchToForgotPassword = () => {
    setAuthModal('forgot')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <UserProfile onBackToHome={handleBackToHome} />
      case 'orders':
        return <MyOrders onBackToHome={handleBackToHome} />
      case 'history':
        return <OrderHistory onBackToHome={handleBackToHome} />
      default:
        return <ProductGrid />
    }
  }

  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-50">
        <Header 
          onCartClick={handleCartClick}
          onLoginClick={handleLoginClick}
          onProfileClick={handleProfileClick}
          onOrdersClick={handleOrdersClick}
          onHistoryClick={handleHistoryClick}
          currentView={currentView}
          onBackToHome={handleBackToHome}
        />
        
        <main className="pb-8">
          {renderCurrentView()}
        </main>

        {/* Cart Component */}
        <Cart 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
        />

        {/* Product Detail Modal */}
        <ProductDetail />

        {/* Authentication Modals */}
        <Login
          isOpen={authModal === 'login'}
          onClose={handleCloseAuthModal}
          onSwitchToSignup={handleSwitchToSignup}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />

        <Signup
          isOpen={authModal === 'signup'}
          onClose={handleCloseAuthModal}
          onSwitchToLogin={handleSwitchToLogin}
        />

        <ForgotPassword
          isOpen={authModal === 'forgot'}
          onClose={handleCloseAuthModal}
          onSwitchToLogin={handleSwitchToLogin}
        />

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">ShopZone</h3>
                <p className="text-gray-300 mb-4">
                  Your one-stop destination for quality products at great prices. Shop with confidence in Indian Rupees.
                </p>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors">
                    <span className="text-xs">f</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors">
                    <span className="text-xs">t</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors">
                    <span className="text-xs">i</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Shop</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">Electronics</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Shoes</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Clothing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Sale Items</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Customer Service</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Size Guide</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-700 pt-8 mt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-300 text-sm">
                  © 2025 ShopZone. All rights reserved. | Made in India 🇮🇳
                </p>
                <div className="flex items-center space-x-6 mt-4 md:mt-0">
                  <span className="text-gray-300 text-sm">We Accept:</span>
                  <span className="text-gray-300 text-sm">UPI</span>
                  <span className="text-gray-300 text-sm">Visa</span>
                  <span className="text-gray-300 text-sm">MasterCard</span>
                  <span className="text-gray-300 text-sm">PayPal</span>
                  <span className="text-gray-300 text-sm">Net Banking</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Provider>
  )
}

export default App
