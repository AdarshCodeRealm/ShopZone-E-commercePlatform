import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import AvatarUpload from './AvatarUpload';
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '@/store/api/apiSlice';
import { updateProfileStart, updateProfileSuccess, updateProfileFailure } from '@/store/slices/authSlice';
import { ArrowLeft } from 'lucide-react';

const UserProfile = ({ onBackToHome }) => {
  const dispatch = useDispatch();
  const { user: authUser, isAuthenticated } = useSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: ''
  });

  // Use RTK Query for data fetching
  const { data: user, isLoading: loading, error, refetch } = useGetUserProfileQuery(undefined, {
    skip: !isAuthenticated
  });
  const [updateProfile, { isLoading: updating }] = useUpdateUserProfileMutation();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  // If not authenticated, show login message
  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please log in to view your profile</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  // Handle error case
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Failed to load profile</h2>
          <p className="text-gray-600 mb-4">
            {error?.data?.detail || error?.message || 'Please try logging in again.'}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const handleAvatarUpdate = (newAvatarUrl) => {
    // Refetch user profile to get updated data
    refetch();
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    dispatch(updateProfileStart());

    try {
      const result = await updateProfile(formData).unwrap();
      dispatch(updateProfileSuccess(formData));
      setIsEditing(false);
      // Refetch to get the latest data
      refetch();
    } catch (error) {
      const errorMessage = error?.data?.detail || error?.message || 'Failed to update profile';
      dispatch(updateProfileFailure(errorMessage));
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      address: user?.address || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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

      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Upload Section */}
        <div className="lg:col-span-1">
          <AvatarUpload
            currentAvatar={user?.avatar}
            onAvatarUpdate={handleAvatarUpdate}
            isLoading={updating}
          />
        </div>

        {/* Profile Information Section */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? 'Updating...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updating}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900">{user?.full_name || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <p className="text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <p className="text-gray-900">{user?.address || 'Not provided'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Member Since
                  </label>
                  <p className="text-gray-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Account Status */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Account Status</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm ${user?.is_active ? 'text-green-700' : 'text-red-700'}`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;