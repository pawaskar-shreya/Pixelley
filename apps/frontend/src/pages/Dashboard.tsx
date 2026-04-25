import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Space } from '../lib/types';
import { Plus, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDimensions, setNewSpaceDimensions] = useState('100x200');
  const navigate = useNavigate();

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

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSpace({ name: newSpaceName, dimensions: newSpaceDimensions, mapId: 'map1' });
      setShowModal(false);
      setNewSpaceName('');
      fetchSpaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSpace = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this space?')) return;
    try {
      await api.deleteSpace(spaceId);
      fetchSpaces();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading spaces...</div>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Spaces</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} /> Create Space
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {spaces.map(space => (
          <div
            key={space.id}
            onClick={() => navigate(`/space/${space.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
          >
            <div className="aspect-video bg-gray-100 relative">
              {space.thumbnail ? (
                <img src={space.thumbnail} alt={space.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Thumbnail</div>
              )}
              <button
                onClick={(e) => handleDeleteSpace(e, space.id)}
                className="absolute top-2 right-2 p-2 bg-white/80 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg">{space.name}</h3>
              <p className="text-gray-500 text-sm">{space.dimensions}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Space</h2>
            <form onSubmit={handleCreateSpace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Space Name</label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dimensions</label>
                <input
                  type="text"
                  value={newSpaceDimensions}
                  onChange={(e) => setNewSpaceDimensions(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                  placeholder="100x200"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
