import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
  clearError 
} from '@/store/slices/authSlice'
import { useForgotPasswordMutation, useResetPasswordMutation } from '@/store/api/apiSlice'
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const ForgotPassword = ({ isOpen, onClose, onSwitchToLogin }) => {
  const dispatch = useDispatch()
  const { loading, error, isResettingPassword } = useSelector(state => state.auth)
  const [forgotPasswordMutation] = useForgotPasswordMutation()
  const [resetPasswordMutation] = useResetPasswordMutation()
  
  const [step, setStep] = useState('email') // 'email' or 'reset'
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')
      setFormErrors({})
      setSuccessMessage('')
      setStep('email')
      dispatch(clearError())
    }
  }, [isOpen, dispatch])

  const validateEmail = () => {
    const errors = {}
    
    if (!email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordReset = () => {
    const errors = {}
    
    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else if (newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters'
    }
    
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateEmail()) return

    dispatch(forgotPasswordStart())
    setSuccessMessage('')

    try {
      await forgotPasswordMutation(email).unwrap()
      
      dispatch(forgotPasswordSuccess({ email }))
      setStep('reset')
      setSuccessMessage('Password reset instructions sent! You can now create a new password.')
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Failed to send reset email. Please try again.'
      dispatch(forgotPasswordFailure(errorMessage))
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (!validatePasswordReset()) return

    dispatch(resetPasswordStart())
    setSuccessMessage('')

    try {
      await resetPasswordMutation({
        email,
        new_password: newPassword
      }).unwrap()
      
      dispatch(resetPasswordSuccess())
      setSuccessMessage('Password reset successfully! You can now login with your new password.')
      
      // Show success message and redirect to login after delay
      setTimeout(() => {
        onClose()
        onSwitchToLogin()
      }, 2000)
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Failed to reset password. Please try again.'
      dispatch(resetPasswordFailure(errorMessage))
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
            <CardTitle className="text-center">
              {step === 'email' ? 'Reset Password' : 'Create New Password'}
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              {step === 'email' 
                ? 'Enter your email to reset your password' 
                : 'Enter your new password below'
              }
            </p>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{successMessage}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (formErrors.email) {
                          setFormErrors(prev => ({ ...prev, email: '' }))
                        }
                      }}
                      className={`pl-10 ${formErrors.email ? 'border-red-300' : ''}`}
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-xs text-red-600">{formErrors.email}</p>
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
                      Sending Reset Instructions...
                    </div>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </Button>

                <div className="text-center">
                  <span className="text-sm text-gray-600">Remember your password? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={onSwitchToLogin}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{successMessage}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (formErrors.newPassword) {
                          setFormErrors(prev => ({ ...prev, newPassword: '' }))
                        }
                      }}
                      className={`pl-10 pr-10 ${formErrors.newPassword ? 'border-red-300' : ''}`}
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
                  {formErrors.newPassword && (
                    <p className="text-xs text-red-600">{formErrors.newPassword}</p>
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
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (formErrors.confirmPassword) {
                          setFormErrors(prev => ({ ...prev, confirmPassword: '' }))
                        }
                      }}
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
                  disabled={isResettingPassword || successMessage}
                >
                  {isResettingPassword ? (
                    <div className="flex items-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </div>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm"
                    onClick={() => setStep('email')}
                    disabled={isResettingPassword}
                  >
                    ← Back to Email
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPassword