import React, { useMemo, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import ProductCard from './ProductCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { setFilters, clearFilters, fetchProductsStart, fetchProductsSuccess, fetchProductsFailure, setCategoriesSuccess } from '@/store/slices/productsSlice'
import { useGetProductsQuery, useGetCategoriesQuery } from '@/store/api/apiSlice'
import { Filter, X, AlertCircle, RefreshCw } from 'lucide-react'

const ProductGrid = () => {
  const dispatch = useDispatch()
  const { items, categories, filters, loading, error } = useSelector(state => state.products)

  // Fetch products from backend
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts
  } = useGetProductsQuery({
    page: 1,
    limit: 100,
    category: filters.category || undefined,
    search: filters.searchTerm || undefined,
    min_price: filters.priceRange[0] > 0 ? filters.priceRange[0] : undefined,
    max_price: filters.priceRange[1] < 250000 ? filters.priceRange[1] : undefined,
    sort_by: filters.sortBy
  })

  // Fetch categories from backend
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories
  } = useGetCategoriesQuery()

  // Debug logging
  useEffect(() => {
    console.log('ProductGrid Debug:', {
      productsData,
      categoriesData,
      isLoadingProducts,
      isLoadingCategories,
      productsError,
      categoriesError,
      items: items.length,
      categories: categories.length
    })
  }, [productsData, categoriesData, isLoadingProducts, isLoadingCategories, productsError, categoriesError, items, categories])

  // Update Redux state when backend data changes
  useEffect(() => {
    if (isLoadingProducts) {
      dispatch(fetchProductsStart())
    } else if (productsError) {
      console.error('Products fetch error:', productsError)
      const errorMessage = productsError?.data?.detail || 
                          productsError?.error || 
                          productsError?.message || 
                          'Failed to fetch products'
      dispatch(fetchProductsFailure(errorMessage))
    } else if (productsData) {
      console.log('Products data received:', productsData)
      // Handle different response formats
      let products = []
      if (Array.isArray(productsData)) {
        products = productsData
      } else if (productsData.products && Array.isArray(productsData.products)) {
        products = productsData.products
      } else if (productsData && typeof productsData === 'object') {
        // If it's an object but not the expected format, try to extract products
        products = Object.values(productsData).find(val => Array.isArray(val)) || []
      }
      
      dispatch(fetchProductsSuccess({
        products,
        pagination: productsData.pagination || null
      }))
    }
  }, [productsData, isLoadingProducts, productsError, dispatch])

  // Update categories in Redux state
  useEffect(() => {
    if (categoriesData && !categoriesError) {
      console.log('Categories data received:', categoriesData)
      let categoryList = []
      
      if (Array.isArray(categoriesData)) {
        categoryList = categoriesData
      } else if (categoriesData.categories && Array.isArray(categoriesData.categories)) {
        categoryList = categoriesData.categories
      }
      
      dispatch(setCategoriesSuccess(categoryList))
    } else if (categoriesError) {
      console.error('Categories fetch error:', categoriesError)
    }
  }, [categoriesData, categoriesError, dispatch])

  // Filter and sort products client-side for better UX
  const filteredProducts = useMemo(() => {
    if (!items || !Array.isArray(items)) {
      console.warn('Items is not an array:', items)
      return []
    }
    
    let filtered = [...items]

    // Search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category)
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price) || 0
      return price >= filters.priceRange[0] && price <= filters.priceRange[1]
    })

    // Sort products
    switch (filters.sortBy) {
      case 'price_asc':
      case 'price-low':
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
        break
      case 'price_desc':
      case 'price-high':
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0))
        break
      case 'rating':
        filtered.sort((a, b) => (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0))
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        break
      default:
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return filtered
  }, [items, filters])

  const handleCategoryFilter = (category) => {
    dispatch(setFilters({ category: category === filters.category ? '' : category }))
  }

  const handleSortChange = (sortBy) => {
    dispatch(setFilters({ sortBy }))
  }

  const handleRetry = () => {
    refetchProducts()
    refetchCategories()
  }

  const hasActiveFilters = filters.category || filters.searchTerm || 
    filters.priceRange[0] > 0 || filters.priceRange[1] < 250000

  // Show loading state
  if (loading || isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || productsError) {
    const displayError = error || (productsError?.data?.detail || productsError?.message || 'Failed to load products')
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load products</h3>
          <p className="text-red-500 text-base mb-6">{displayError}</p>
          <div className="space-x-4">
            <Button onClick={handleRetry} className="inline-flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p>Make sure the backend server is running on port 8000</p>
            <p className="mt-1">Check console for detailed error information</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters and Sorting */}
      <div className="mb-6 space-y-4">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            <Filter className="h-4 w-4 mr-1" />
            Categories:
          </span>
          {isLoadingCategories ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          ) : categories.length > 0 ? (
            categories.map(category => {
              const categoryName = typeof category === 'string' ? category : category.name
              const categoryCount = typeof category === 'object' ? category.count : null
              
              return (
                <Button
                  key={categoryName}
                  variant={filters.category === categoryName ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(categoryName)}
                  className="text-xs"
                >
                  {categoryName} {categoryCount && `(${categoryCount})`}
                </Button>
              )
            })
          ) : (
            <span className="text-sm text-gray-500">No categories available</span>
          )}
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          {[
            { value: 'name', label: 'Name' },
            { value: 'price_asc', label: 'Price: Low to High' },
            { value: 'price_desc', label: 'Price: High to Low' },
            { value: 'rating', label: 'Rating' },
            { value: 'newest', label: 'Newest' }
          ].map(option => (
            <Button
              key={option.value}
              variant={filters.sortBy === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleSortChange(option.value)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => dispatch(setFilters({ category: '' }))}
                />
              </Badge>
            )}
            {filters.searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                "{filters.searchTerm}"
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => dispatch(setFilters({ searchTerm: '' }))}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearFilters())}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {filteredProducts.length} of {items.length} products
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-2">
            {items.length === 0 ? 'No products available' : 'Try adjusting your filters'}
          </p>
          {items.length === 0 && (
            <Button onClick={handleRetry} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductGrid