import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:8000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem('token')
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Product', 'Category', 'User', 'Order', 'Cart', 'Review', 'Wishlist'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    signup: builder.mutation({
      query: (userData) => ({
        url: 'auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),
    
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: { email },
      }),
    }),
    
    resetPassword: builder.mutation({
      query: (resetData) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: resetData,
      }),
    }),
    
    // Products endpoints
    getProducts: builder.query({
      query: ({ 
        page = 1, 
        limit = 12,
        category, 
        search, 
        min_price,
        max_price,
        sort_by = 'name' 
      } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          sort_by,
        })
        if (category) params.append('category', category)
        if (search) params.append('search', search)
        if (min_price) params.append('min_price', min_price.toString())
        if (max_price) params.append('max_price', max_price.toString())
        
        return `products?${params}`
      },
      providesTags: ['Product'],
      transformResponse: (response) => {
        // Handle both paginated and direct array responses
        if (response && typeof response === 'object') {
          if (response.products && Array.isArray(response.products)) {
            return response // Return full response with pagination
          } else if (Array.isArray(response)) {
            return { products: response, pagination: null } // Wrap array in object
          }
        }
        return { products: [], pagination: null } // Fallback
      },
    }),
    
    getProduct: builder.query({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    
    getFeaturedProducts: builder.query({
      query: () => 'products/featured',
      providesTags: ['Product'],
      transformResponse: (response) => {
        return Array.isArray(response) ? response : []
      },
    }),
    
    getCategories: builder.query({
      query: () => 'products/categories',
      providesTags: ['Category'],
      transformResponse: (response) => {
        // Handle different response formats
        if (response && response.categories) {
          return response.categories
        } else if (Array.isArray(response)) {
          return response
        }
        return []
      },
    }),
    
    // Cart endpoints
    getCart: builder.query({
      query: () => 'cart',
      providesTags: ['Cart'],
    }),
    
    addToCart: builder.mutation({
      query: (item) => ({
        url: 'cart/add',
        method: 'POST',
        body: item,
      }),
      invalidatesTags: ['Cart'],
    }),
    
    updateCartItem: builder.mutation({
      query: ({ productId, quantity }) => ({
        url: `cart/update/${productId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    
    removeFromCart: builder.mutation({
      query: (productId) => ({
        url: `cart/remove/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    
    clearCart: builder.mutation({
      query: () => ({
        url: 'cart/clear',
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    
    // Orders endpoints
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: 'orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),
    
    getUserOrders: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        return `orders?${params}`
      },
      providesTags: ['Order'],
    }),
    
    getOrder: builder.query({
      query: (orderId) => `orders/${orderId}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    
    cancelOrder: builder.mutation({
      query: (orderId) => ({
        url: `orders/${orderId}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: ['Order'],
    }),
    
    // User/Profile endpoints
    getUserProfile: builder.query({
      query: () => 'users/profile',
      providesTags: ['User'],
    }),
    
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: 'users/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),
    
    updatePassword: builder.mutation({
      query: (passwordData) => ({
        url: 'users/change-password',
        method: 'PUT',
        body: passwordData,
      }),
    }),
    
    // Wishlist endpoints
    getWishlist: builder.query({
      query: () => 'users/wishlist',
      providesTags: ['Wishlist'],
    }),
    
    addToWishlist: builder.mutation({
      query: (productId) => ({
        url: 'users/wishlist/add',
        method: 'POST',
        body: { product_id: productId },
      }),
      invalidatesTags: ['Wishlist'],
    }),
    
    removeFromWishlist: builder.mutation({
      query: (productId) => ({
        url: `users/wishlist/remove/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),
    
    // Reviews endpoints
    getProductReviews: builder.query({
      query: ({ productId, page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })
        return `products/${productId}/reviews?${params}`
      },
      providesTags: ['Review'],
    }),
    
    addReview: builder.mutation({
      query: ({ productId, reviewData }) => ({
        url: `products/${productId}/reviews`,
        method: 'POST',
        body: reviewData,
      }),
      invalidatesTags: ['Review', 'Product'],
    }),
    
    updateReview: builder.mutation({
      query: ({ reviewId, reviewData }) => ({
        url: `reviews/${reviewId}`,
        method: 'PUT',
        body: reviewData,
      }),
      invalidatesTags: ['Review', 'Product'],
    }),
    
    deleteReview: builder.mutation({
      query: (reviewId) => ({
        url: `reviews/${reviewId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review', 'Product'],
    }),
    
    // Address endpoints
    getUserAddresses: builder.query({
      query: () => 'users/addresses',
      providesTags: ['User'],
    }),
    
    addAddress: builder.mutation({
      query: (addressData) => ({
        url: 'users/addresses',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['User'],
    }),
    
    updateAddress: builder.mutation({
      query: ({ addressId, addressData }) => ({
        url: `users/addresses/${addressId}`,
        method: 'PUT',
        body: addressData,
      }),
      invalidatesTags: ['User'],
    }),
    
    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `users/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
    
    // Payment endpoints
    createPaymentIntent: builder.mutation({
      query: (paymentData) => ({
        url: 'payments/create-intent',
        method: 'POST',
        body: paymentData,
      }),
    }),
    
    confirmPayment: builder.mutation({
      query: (paymentData) => ({
        url: 'payments/confirm',
        method: 'POST',
        body: paymentData,
      }),
    }),
  }),
})

export const {
  // Auth
  useLoginMutation,
  useSignupMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  // Products
  useGetProductsQuery,
  useGetProductQuery,
  useGetFeaturedProductsQuery,
  useGetCategoriesQuery,
  // Cart
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  // Orders
  useCreateOrderMutation,
  useGetUserOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  // User
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdatePasswordMutation,
  // Wishlist
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  // Reviews
  useGetProductReviewsQuery,
  useAddReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  // Addresses
  useGetUserAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  // Payments
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
} = apiSlice