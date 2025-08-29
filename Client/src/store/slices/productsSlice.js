import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  categories: [],
  selectedProduct: null,
  loading: false,
  error: null,
  filters: {
    category: '',
    priceRange: [0, 250000],
    sortBy: 'name',
    searchTerm: ''
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  }
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart: (state) => {
      state.loading = true
      state.error = null
    },
    fetchProductsSuccess: (state, action) => {
      state.loading = false
      state.items = action.payload.products || action.payload
      if (action.payload.pagination) {
        state.pagination = {
          ...state.pagination,
          ...action.payload.pagination
        }
      } else {
        // If no pagination data, assume all products are loaded
        state.pagination.totalItems = state.items.length
        state.pagination.totalPages = Math.ceil(state.items.length / state.pagination.itemsPerPage)
      }
    },
    fetchProductsFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload
    },
    setCategoriesSuccess: (state, action) => {
      state.categories = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.currentPage = 1 // Reset to first page when filters change
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        priceRange: [0, 250000],
        sortBy: 'name',
        searchTerm: ''
      }
      state.pagination.currentPage = 1
    },
    setCurrentPage: (state, action) => {
      state.pagination.currentPage = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
})

export const {
  fetchProductsStart,
  fetchProductsSuccess,
  fetchProductsFailure,
  setSelectedProduct,
  setCategoriesSuccess,
  setFilters,
  clearFilters,
  setCurrentPage,
  clearError
} = productsSlice.actions

export default productsSlice.reducer