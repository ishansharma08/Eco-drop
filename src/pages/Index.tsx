import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '@/components/LandingPage';

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/user');
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingPage onGetStarted={handleGetStarted} />
    </div>
  );
};

export default Index;
