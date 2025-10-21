"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PublicRoute: React.FC = () => {
  const { session, loading } = useSession();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('loading')}...
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;