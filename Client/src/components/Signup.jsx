import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  signupStart, 
  signupSuccess, 
  signupFailure, 
  clearError 
} from '@/store/slices/authSlice'
import { useSignupMutation } from '@/store/api/apiSlice'
import { X, Eye, EyeOff, Mail, Lock, User, Phone, Upload, MapPin } from 'lucide-react'

const Signup = ({ isOpen, onClose, onSwitchToLogin }) => {
  const dispatch = useDispatch()
  const { loading, error } = useSelector(state => state.auth)
  const [signupMutation] = useSignupMutation()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',  // Added address field
    password: '',
    confirmPassword: '',
    avatar: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)

  const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=6366f1&color=ffffff&size=128`

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', phone: '', address: '', password: '', confirmPassword: '', avatar: null })
      setFormErrors({})
      setAvatarPreview(null)
      dispatch(clearError())
    }
  }, [isOpen, dispatch])

  const validateSignupForm = () => {
    const errors = {}
    
    if (!formData.name) {
      errors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters'
    }
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }
    
    if (!formData.phone) {
      errors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Phone number must be 10 digits'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({
          ...prev,
          avatar: 'Please select a valid image file'
        }))
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({
          ...prev,
          avatar: 'Image size should be less than 5MB'
        }))
        return
      }
      
      setFormData(prev => ({
        ...prev,
        avatar: file
      }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
      
      if (formErrors.avatar) {
        setFormErrors(prev => ({
          ...prev,
          avatar: ''
        }))
      }
    }
  }

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: null
    }))
    setAvatarPreview(null)
    const fileInput = document.getElementById('avatar-input')
    if (fileInput) fileInput.value = ''
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateSignupForm()) return

    dispatch(signupStart())

    try {
      let avatarData = null
      
      // Convert avatar file to base64 if exists
      if (formData.avatar) {
        avatarData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(formData.avatar)
        })
      }
      
      const signupData = {
        full_name: formData.name, // Changed from 'name' to 'full_name' to match backend
        email: formData.email,
        phone: formData.phone,
        address: formData.address,  // Added address field
        password: formData.password,
        avatar: avatarData // Send base64 data or null
      }
      
      const result = await signupMutation(signupData).unwrap()
      
      dispatch(signupSuccess({
        user: result.user,
        token: result.access_token
      }))
      
      onClose()
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Failed to create account. Please try again.'
      dispatch(signupFailure(errorMessage))
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <CardTitle className="text-center">Create Account</CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Join ShopZone today
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}


              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Profile Picture <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={defaultAvatarUrl} 
                        alt="Default avatar" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label htmlFor="avatar-input">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        asChild
                      >
                        <div className="flex items-center space-x-2">
                          <Upload className="h-4 w-4" />
                          <span>Upload</span>
                        </div>
                      </Button>
                    </label>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    {avatarPreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
                {formErrors.avatar && (
                  <p className="text-xs text-red-600">{formErrors.avatar}</p>
                )}
                <p className="text-xs text-gray-500">
                  Upload a profile picture or we'll create one for you with your initials.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 ${formErrors.name ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${formErrors.email ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-red-600">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`pl-10 ${formErrors.phone ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-xs text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Address <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    name="address"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`pl-10 ${formErrors.address ? 'border-red-300' : ''}`}
                  />
                </div>
                {formErrors.address && (
                  <p className="text-xs text-red-600">{formErrors.address}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${formErrors.password ? 'border-red-300' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-600">{formErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-red-300' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-600">{formErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600">Already have an account? </span>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={onSwitchToLogin}
                >
                  Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Signup