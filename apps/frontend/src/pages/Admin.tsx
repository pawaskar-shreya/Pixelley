import React, { useState } from 'react';
import { api } from '../lib/api';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'element' | 'avatar' | 'map'>('element');
  const [message, setMessage] = useState('');

  const handleCreateElement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminCreateElement({
        imageUrl: formData.get('imageUrl'),
        width: Number(formData.get('width')),
        height: Number(formData.get('height')),
        static: formData.get('static') === 'true',
      });
      setMessage('Element created successfully');
      e.currentTarget.reset();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateAvatar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminCreateAvatar({
        imageUrl: formData.get('imageUrl'),
        name: formData.get('name'),
      });
      setMessage('Avatar created successfully');
      e.currentTarget.reset();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateMap = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.adminCreateMap({
        thumbnail: formData.get('thumbnail'),
        dimensions: formData.get('dimensions'),
        name: formData.get('name'),
        defaultElements: [], // Simplified for now
      });
      setMessage('Map created successfully');
      e.currentTarget.reset();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      <div className="flex gap-4 mb-8 border-b">
        {(['element', 'avatar', 'map'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setMessage(''); }}
            className={`pb-2 px-4 capitalize ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
          >
            Create {tab}
          </button>
        ))}
      </div>

      {message && <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">{message}</div>}

      {activeTab === 'element' && (
        <form onSubmit={handleCreateElement} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input name="imageUrl" type="url" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Width</label>
              <input name="width" type="number" required className="mt-1 block w-full rounded-md border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Height</label>
              <input name="height" type="number" required className="mt-1 block w-full rounded-md border p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Static (Collision)</label>
            <select name="static" className="mt-1 block w-full rounded-md border p-2">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Element</button>
        </form>
      )}

      {activeTab === 'avatar' && (
        <form onSubmit={handleCreateAvatar} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" type="text" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Image URL</label>
            <input name="imageUrl" type="url" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Avatar</button>
        </form>
      )}

      {activeTab === 'map' && (
        <form onSubmit={handleCreateMap} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" type="text" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Dimensions</label>
            <input name="dimensions" type="text" placeholder="100x200" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Thumbnail URL</label>
            <input name="thumbnail" type="url" required className="mt-1 block w-full rounded-md border p-2" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Map</button>
        </form>
      )}
    </div>
  );
}
