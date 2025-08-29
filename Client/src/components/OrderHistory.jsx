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
  History,
  ArrowLeft
} from 'lucide-react';

const OrderHistory = ({ onBackToHome }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      // This will be connected to your backend API later
      // For now, using mock data - only delivered and cancelled orders
      const mockOrders = [
        {
          id: 'ORD001',
          order_number: '#ORD001',
          status: 'delivered',
          total_amount: 2999.99,
          created_at: '2025-08-25T10:30:00Z',
          delivered_at: '2025-08-28T16:30:00Z',
          items: [
            { name: 'Wireless Headphones', quantity: 1, price: 1999.99 },
            { name: 'Phone Case', quantity: 2, price: 500.00 }
          ],
          shipping_address: {
            street: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          payment_method: 'Credit Card'
        },
        {
          id: 'ORD004',
          order_number: '#ORD004',
          status: 'cancelled',
          total_amount: 1299.99,
          created_at: '2025-08-20T12:15:00Z',
          cancelled_at: '2025-08-21T09:00:00Z',
          items: [
            { name: 'Gaming Mouse', quantity: 1, price: 1299.99 }
          ],
          shipping_address: {
            street: '321 Tech Plaza',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
          },
          payment_method: 'UPI',
          cancellation_reason: 'Customer request'
        }
      ];

      // Simulate API delay
      setTimeout(() => {
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching order history:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      delivered: 'bg-green-100 text-green-800 border-green-200',
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
            <p className="text-gray-600">Loading your order history...</p>
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
        <div className="flex items-center space-x-3">
          <History className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
        </div>
        <Button onClick={fetchOrderHistory} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Order Status Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All History' },
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
          <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'No order history' : `No ${selectedStatus} orders`}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'all' 
              ? "You don't have any completed orders yet."
              : `You don't have any ${selectedStatus} orders in your history.`
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
                    {order.delivered_at && (
                      <p className="text-sm text-green-600">
                        Delivered on {new Date(order.delivered_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                    {order.cancelled_at && (
                      <p className="text-sm text-red-600">
                        Cancelled on {new Date(order.cancelled_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(order.status)}
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {order.status === 'delivered' && (
                    <Button variant="outline" size="sm" className="text-blue-600">
                      Reorder
                    </Button>
                  )}
                </div>
              </div>

              {/* Cancellation Reason */}
              {order.status === 'cancelled' && order.cancellation_reason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Cancellation Reason:</strong> {order.cancellation_reason}
                  </p>
                </div>
              )}

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
                    <p className={`text-xl font-bold ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-600'}`}>
                      ₹{order.total_amount.toLocaleString('en-IN')}
                    </p>
                    {order.status === 'cancelled' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Refund processed
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

export default OrderHistory;