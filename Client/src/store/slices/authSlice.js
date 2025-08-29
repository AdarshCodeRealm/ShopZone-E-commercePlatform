import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('user'),
  loading: false,
  error: null,
  otpSent: false,
  emailForOtp: null,
  isVerifyingOtp: false,
  isResettingPassword: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sign Up Actions
    signupStart: (state) => {
      state.loading = true
      state.error = null
    },
    signupSuccess: (state, action) => {
      state.loading = false
      state.otpSent = true
      state.emailForOtp = action.payload.email
    },
    signupFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    
    // OTP Verification Actions
    verifyOtpStart: (state) => {
      state.isVerifyingOtp = true
      state.error = null
    },
    verifyOtpSuccess: (state, action) => {
      state.isVerifyingOtp = false
      state.otpSent = false
      state.emailForOtp = null
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('token', action.payload.token)
    },
    verifyOtpFailure: (state, action) => {
      state.isVerifyingOtp = false
      state.error = action.payload
    },
    
    // Login Actions
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.user = action.payload.user
      state.isAuthenticated = true
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('token', action.payload.token)
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    
    // Forgot Password Actions (Simplified - no OTP)
    forgotPasswordStart: (state) => {
      state.loading = true
      state.error = null
    },
    forgotPasswordSuccess: (state, action) => {
      state.loading = false
    },
    forgotPasswordFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    
    // Reset Password Actions
    resetPasswordStart: (state) => {
      state.isResettingPassword = true
      state.error = null
    },
    resetPasswordSuccess: (state) => {
      state.isResettingPassword = false
    },
    resetPasswordFailure: (state, action) => {
      state.isResettingPassword = false
      state.error = action.payload
    },
    
    // Logout
    logout: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.otpSent = false
      state.emailForOtp = null
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },
    
    // Clear Error
    clearError: (state) => {
      state.error = null
    },
    
    // Resend OTP (for signup only)
    resendOtpStart: (state) => {
      state.loading = true
      state.error = null
    },
    resendOtpSuccess: (state) => {
      state.loading = false
    },
    resendOtpFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },

    // Avatar Update Actions
    updateAvatarStart: (state) => {
      state.loading = true
      state.error = null
    },
    updateAvatarSuccess: (state, action) => {
      state.loading = false
      if (state.user) {
        state.user.avatar = action.payload.avatar_url
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    updateAvatarFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    
    // Profile Update Actions
    updateProfileStart: (state) => {
      state.loading = true
      state.error = null
    },
    updateProfileSuccess: (state, action) => {
      state.loading = false
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      }
    },
    updateProfileFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
  },
})

export const {
  signupStart,
  signupSuccess,
  signupFailure,
  verifyOtpStart,
  verifyOtpSuccess,
  verifyOtpFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
  logout,
  clearError,
  resendOtpStart,
  resendOtpSuccess,
  resendOtpFailure,
  updateAvatarStart,
  updateAvatarSuccess,
  updateAvatarFailure,
  updateProfileStart,
  updateProfileSuccess,
  updateProfileFailure,
} = authSlice.actions

export default authSlice.reducer