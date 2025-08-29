import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

const MyOrders = ({ onBackToHome }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // This will be connected to your backend API later
      // For now, using mock data - filtering only processing and shipped orders
      const mockOrders = [
        {
          id: 'ORD002',
          order_number: '#ORD002',
          status: 'shipped',
          total_amount: 1599.99,
          created_at: '2025-08-27T15:45:00Z',
          estimated_delivery: '2025-08-30T18:00:00Z',
          items: [
            { name: 'Bluetooth Speaker', quantity: 1, price: 1599.99 }
          ],
          shipping_address: {
            street: '456 Park Avenue',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          payment_method: 'UPI'
        },
        {
          id: 'ORD003',
          order_number: '#ORD003',
          status: 'processing',
          total_amount: 899.99,
          created_at: '2025-08-28T09:15:00Z',
          estimated_delivery: '2025-09-02T18:00:00Z',
          items: [
            { name: 'USB Cable', quantity: 3, price: 299.99 }
          ],
          shipping_address: {
            street: '789 Tech Street',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          },
          payment_method: 'Debit Card'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      delivered: 'bg-green-100 text-green-800 border-green-200',
      shipped: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <Badge className={`${variants[status]} capitalize`}>
        {status}
      </Badge>
    );
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back to Home Button */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBackToHome}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Order Status Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'processing', label: 'Processing' },
          { key: 'shipped', label: 'Shipped' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((filter) => (
          <Button
            key={filter.key}
            variant={selectedStatus === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStatus(filter.key)}
            className="whitespace-nowrap"
          >
            {filter.label}
            {filter.key === 'all' && (
              <Badge className="ml-2 bg-gray-200 text-gray-800">
                {orders.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'No orders yet' : `No ${selectedStatus} orders`}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your orders here!"
              : `You don't have any ${selectedStatus} orders at the moment.`
            }
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Start Shopping
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="font-semibold text-lg">{order.order_number}</h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(order.status)}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t border-b py-4 mb-4">
                <h4 className="font-medium mb-3">Items ({order.items.length})</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-800">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Footer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Shipping Address</p>
                    <p className="text-gray-600">
                      {order.shipping_address.street}, {order.shipping_address.city}
                    </p>
                    <p className="text-gray-600">
                      {order.shipping_address.state} - {order.shipping_address.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CreditCard className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Payment Method</p>
                    <p className="text-gray-600">{order.payment_method}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </p>
                    {order.estimated_delivery && (
                      <p className="text-xs text-gray-500 mt-1">
                        Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;