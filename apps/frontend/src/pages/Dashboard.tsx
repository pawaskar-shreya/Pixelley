import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Space } from '../lib/types';
import { useAuthStore } from '../lib/store';

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const fetchSpaces = async () => {
    try {
      const res = await api.getSpaces();
      setSpaces(res.spaces || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token'); // optional but safe
    navigate('/signin');
  };

  if (loading) {
    return <div className="p-8 text-center">Loading spaces...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          Join a Space and have fun!
        </h1>

        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          Logout
        </button>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center text-gray-500">
          No spaces found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              onClick={() => navigate(`/space/${space.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="aspect-video bg-gray-100">
                {space.thumbnail ? (
                  <img
                    src={space.thumbnail}
                    alt={space.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Thumbnail
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}