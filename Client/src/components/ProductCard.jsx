import React from 'react'
import { useDispatch } from 'react-redux'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { addToCart } from '@/store/slices/cartSlice'
import { setSelectedProduct } from '@/store/slices/productsSlice'
import { formatCurrency } from '@/lib/utils'
import { Star, Heart, ShoppingCart } from 'lucide-react'

const ProductCard = ({ product }) => {
  const dispatch = useDispatch()

  const handleAddToCart = (e) => {
    e.stopPropagation()
    dispatch(addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      quantity: 1
    }))
  }

  const handleProductClick = () => {
    dispatch(setSelectedProduct(product))
  }

  const renderStars = (rating) => {
    const numRating = parseFloat(rating) || 0
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(numRating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const originalPrice = product.original_price || product.originalPrice
  const currentPrice = product.price
  const discountPercentage = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0

  const isInStock = product.in_stock !== undefined ? product.in_stock : product.inStock !== false
  const productRating = product.rating || 0
  const productReviews = product.reviews || product.review_count || 0
  const productTags = product.tags || []

  return (
    <Card 
      className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col"
      onClick={handleProductClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={product.image || product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
          alt={product.name || 'Product'}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {!isInStock && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
          {discountPercentage > 0 && (
            <Badge className="bg-red-500">{discountPercentage}% OFF</Badge>
          )}
          {productTags.includes('new') && (
            <Badge className="bg-green-500">New</Badge>
          )}
          {productTags.includes('bestseller') && (
            <Badge className="bg-blue-500">Bestseller</Badge>
          )}
          {productTags.includes('featured') && (
            <Badge className="bg-purple-500">Featured</Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-4 flex-1">
        <div className="space-y-2">
          <Badge variant="outline">{product.category || 'General'}</Badge>
          <h3 className="font-semibold text-lg line-clamp-1">{product.name || 'Product Name'}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{product.description || 'No description available'}</p>
          
          {/* Rating */}
          {productRating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {renderStars(productRating)}
              </div>
              <span className="text-sm text-gray-500">
                {productRating} {productReviews > 0 && `(${productReviews} reviews)`}
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(currentPrice)}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className="w-full"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isInStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard