import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Avatar } from '../lib/types';

export default function AvatarSelection() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getAvatars()
      .then(res => {
        setAvatars(res.avatars || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!selectedAvatar) return;
    try {
      await api.updateMetadata({ avatarId: selectedAvatar });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading avatars...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Select Your Avatar</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {avatars.map(avatar => (
          <div
            key={avatar.id}
            onClick={() => setSelectedAvatar(avatar.id)}
            className={`cursor-pointer rounded-lg p-4 border-2 transition-all ${
              selectedAvatar === avatar.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200'
            }`}
          >
            <img src={avatar.imageUrl} alt={avatar.name} className="w-full aspect-square object-contain mb-2" />
            <p className="text-center font-medium">{avatar.name}</p>
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={!selectedAvatar}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50"
      >
        Save & Continue
      </button>
    </div>
  );
}
