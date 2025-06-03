import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import RoleSelection from './Onboarding/RoleSelection';
import PurposeSelection from './Onboarding/PurposeSelection';
import Dashboard from './Dashboard/Dashboard';

const OnboardingRoutes = () => {
  return (
    <Routes>
      <Route path="/onboarding/role" element={<RoleSelection />} />
      <Route path="/onboarding/purpose" element={<PurposeSelection />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/" element={<Navigate to="/onboarding/role" replace />} />
    </Routes>
  );
};

export default OnboardingRoutes;