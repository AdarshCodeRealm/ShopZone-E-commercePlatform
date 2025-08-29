import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { setFilters } from '@/store/slices/productsSlice'
import { logout } from '@/store/slices/authSlice'
import { 
  ShoppingCart, 
  Search, 
  User, 
  Heart, 
  Menu, 
  LogOut,
  ChevronDown,
  Package,
  Clock,
  Settings,
  UserCircle
} from 'lucide-react'

const Header = ({ 
  onCartClick, 
  onLoginClick, 
  onProfileClick, 
  onOrdersClick, 
  onHistoryClick,
  currentView, 
  onBackToHome 
}) => {
  const dispatch = useDispatch()
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  const cartItems = useSelector(state => state.cart.items)
  const { searchTerm } = useSelector(state => state.products.filters)
  const { user, isAuthenticated } = useSelector(state => state.auth)
  
  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    dispatch(setFilters({ searchTerm: e.target.value }))
  }

  const handleLogout = () => {
    dispatch(logout())
    setIsUserDropdownOpen(false)
    onBackToHome() // Navigate back to home when logging out
  }

  const handleAccountClick = () => {
    if (!isAuthenticated) {
      onLoginClick()
    } else {
      setIsUserDropdownOpen(!isUserDropdownOpen)
    }
  }

  const handleLogoClick = () => {
    onBackToHome()
  }

  const handleDropdownItemClick = (action) => {
    setIsUserDropdownOpen(false)
    // Handle different actions
    switch (action) {
      case 'profile':
        onProfileClick && onProfileClick()
        break
      case 'orders':
        onOrdersClick && onOrdersClick()
        break
      case 'history':
        onHistoryClick && onHistoryClick()
        break
      case 'wishlist':
        onWishlistClick && onWishlistClick()
        break
      default:
        break
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleLogoClick}
            >
              ShopZone
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-6">
            {/* Cart - Separate from user dropdown */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCartClick}
              className="relative hover:bg-gray-100 p-2 rounded-full"
            >
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-600">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* User Account Section */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAccountClick}
                  className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.full_name || user.name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <User className={`h-4 w-4 text-white ${user?.avatar ? 'hidden' : 'block'}`} />
                  </div>
                  <div className="hidden md:flex items-center space-x-1">
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.full_name || user?.name || 'User'}
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </Button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.full_name || user.name || 'User'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user?.full_name || user?.name || 'User'}
                          </p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => handleDropdownItemClick('profile')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                      >
                        <UserCircle className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-800">My Profile</span>
                      </button>
                      
                      <button
                        onClick={() => handleDropdownItemClick('orders')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                      >
                        <Package className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-800">My Orders</span>
                      </button>
                      
                      <button
                        onClick={() => handleDropdownItemClick('history')}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
                      >
                        <Clock className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-800">Order History</span>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button 
                variant="outline"
                size="sm" 
                onClick={handleAccountClick}
                className="flex items-center space-x-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <User className="h-4 w-4" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header