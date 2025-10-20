"use client";

import Layout from "@/components/Layout";
import TaskList from "./TaskList";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // Import useTranslation

const Index = () => {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('loading')}...</div>;
  }

  if (!session) {
    return null; // Or a loading spinner, as the redirect will happen
  }

  return (
    <Layout>
      <TaskList />
    </Layout>
  );
};

export default Index;