const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize mock DB in localStorage
const initDB = () => {
  if (!localStorage.getItem('mock_db')) {
    localStorage.setItem('mock_db', JSON.stringify({
      users: [{ id: '1', username: 'test', password: 'password', type: 'user' }],
      avatars: [
        { id: 'a1', imageUrl: 'https://picsum.photos/seed/a1/100/100', name: 'Cool Cat' },
        { id: 'a2', imageUrl: 'https://picsum.photos/seed/a2/100/100', name: 'Doggo' },
        { id: 'a3', imageUrl: 'https://picsum.photos/seed/a3/100/100', name: 'Fox' },
        { id: 'a4', imageUrl: 'https://picsum.photos/seed/a4/100/100', name: 'Bear' }
      ],
      elements: [
        { id: 'e1', imageUrl: 'https://picsum.photos/seed/tree/64/64', width: 64, height: 64, static: true },
        { id: 'e2', imageUrl: 'https://picsum.photos/seed/chair/32/32', width: 32, height: 32, static: false },
        { id: 'e3', imageUrl: 'https://picsum.photos/seed/table/64/32', width: 64, height: 32, static: true }
      ],
      spaces: [
        { id: 's1', name: 'Welcome Lounge', dimensions: "1600x1200", thumbnail: 'https://picsum.photos/seed/lounge/300/200' }
      ],
      spaceElements: {
        's1': [
          { id: 'se1', elementId: 'e1', x: 400, y: 300 },
          { id: 'se2', elementId: 'e2', x: 500, y: 300 }
        ]
      }
    }));
  }
};

initDB();

const getDB = () => JSON.parse(localStorage.getItem('mock_db') || '{}');
const saveDB = (db: any) => localStorage.setItem('mock_db', JSON.stringify(db));
const generateId = () => Math.random().toString(36).substring(2, 9);

const checkAuth = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/auth/signin';
    throw new Error('Unauthorized');
  }
  return token; // Using token as userId in this mock
};

export const api = {
  // Auth
  signup: async (data: any) => {
    await delay(500);
    const db = getDB();
    if (db.users.find((u: any) => u.username === data.username)) {
      throw new Error('Username already exists');
    }
    const newUser = { id: generateId(), username: data.username, password: data.password, type: data.type || 'user' };
    db.users.push(newUser);
    saveDB(db);
    return { userId: newUser.id };
  },
  signin: async (data: any) => {
    await delay(500);
    const db = getDB();
    const user = db.users.find((u: any) => u.username === data.username && u.password === data.password);
    if (!user) throw new Error('Invalid credentials');
    return { token: user.id }; // Mock token is just user ID
  },
  
  // User
  getAvatars: async () => {
    await delay(300);
    return { avatars: getDB().avatars };
  },
  updateMetadata: async (data: any) => {
    await delay(300);
    const userId = checkAuth();
    const db = getDB();
    const userIndex = db.users.findIndex((u: any) => u.id === userId);
    if (userIndex > -1) {
      db.users[userIndex].avatarId = data.avatarId;
      saveDB(db);
    }
    return { success: true };
  },
  getBulkMetadata: async (ids: string[]) => {
    await delay(300);
    const db = getDB();
    const avatars = ids.map((id: string) => {
      const user = db.users.find((u: any) => u.id === id);
      const avatar = user ? db.avatars.find((a: any) => a.id === user.avatarId) : null;
      return {
        userId: id,
        imageUrl: avatar ? avatar.imageUrl : 'https://picsum.photos/seed/default/100/100'
      };
    });
    return { avatars };
  },
  
  // Spaces
  getSpaces: async () => {
    await delay(300);
    checkAuth();
    return { spaces: getDB().spaces };
  },
  createSpace: async (data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const newSpace = {
      id: generateId(),
      name: data.name,
      dimensions: data.dimensions,
      thumbnail: `https://picsum.photos/seed/${generateId()}/300/200`
    };
    db.spaces.push(newSpace);
    db.spaceElements[newSpace.id] = [];
    saveDB(db);
    return { spaceId: newSpace.id };
  },
  deleteSpace: async (spaceId: string) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    db.spaces = db.spaces.filter((s: any) => s.id !== spaceId);
    delete db.spaceElements[spaceId];
    saveDB(db);
    return { success: true };
  },
  getSpace: async (spaceId: string) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const space = db.spaces.find((s: any) => s.id === spaceId);
    if (!space) throw new Error('Space not found');
    
    const spaceElements = db.spaceElements[spaceId] || [];
    const elements = spaceElements.map((se: any) => {
      const el = db.elements.find((e: any) => e.id === se.elementId);
      return {
        id: se.id,
        element: el,
        x: se.x,
        y: se.y
      };
    }).filter((se: any) => se.element);

    return {
      dimensions: space.dimensions,
      elements
    };
  },
  
  // Elements
  getElements: async () => {
    await delay(300);
    checkAuth();
    return { elements: getDB().elements };
  },
  addElementToSpace: async (data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const newElement = {
      id: generateId(),
      elementId: data.elementId,
      x: data.x,
      y: data.y
    };
    if (!db.spaceElements[data.spaceId]) {
      db.spaceElements[data.spaceId] = [];
    }
    db.spaceElements[data.spaceId].push(newElement);
    saveDB(db);
    return { id: newElement.id };
  },
  deleteElementFromSpace: async (id: string) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    for (const spaceId in db.spaceElements) {
      db.spaceElements[spaceId] = db.spaceElements[spaceId].filter((se: any) => se.id !== id);
    }
    saveDB(db);
    return { success: true };
  },
  
  // Admin
  adminCreateElement: async (data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const newElement = {
      id: generateId(),
      imageUrl: data.imageUrl,
      width: data.width,
      height: data.height,
      static: data.static
    };
    db.elements.push(newElement);
    saveDB(db);
    return { id: newElement.id };
  },
  adminUpdateElement: async (elementId: string, data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const elIndex = db.elements.findIndex((e: any) => e.id === elementId);
    if (elIndex > -1) {
      db.elements[elIndex] = { ...db.elements[elIndex], ...data };
      saveDB(db);
    }
    return { success: true };
  },
  adminCreateAvatar: async (data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const newAvatar = {
      id: generateId(),
      imageUrl: data.imageUrl,
      name: data.name
    };
    db.avatars.push(newAvatar);
    saveDB(db);
    return { avatarId: newAvatar.id };
  },
  adminCreateMap: async (data: any) => {
    await delay(300);
    checkAuth();
    const db = getDB();
    const newMap = {
      id: generateId(),
      name: data.name,
      dimensions: data.dimensions,
      thumbnail: data.thumbnail
    };
    db.spaces.push(newMap);
    db.spaceElements[newMap.id] = data.defaultElements || [];
    saveDB(db);
    return { id: newMap.id };
  },
};
