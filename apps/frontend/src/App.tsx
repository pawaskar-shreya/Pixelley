/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup';
import Signin from './pages/Signin';
import Dashboard from './pages/Dashboard';
import Space from './pages/Space';
import Admin from './pages/Admin';
import AvatarSelection from './pages/AvatarSelection';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/space/:spaceId" element={<Space />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/avatar" element={<AvatarSelection />} />
      </Routes>
    </Router>
  );
}
