"use client";

import Layout from "@/components/Layout";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "./TaskList";
import { useSession } from "@/context/SessionContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login');
    }
  }, [session, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null; // Or a loading spinner, as the redirect will happen
  }

  return (
    <TaskProvider>
      <Layout>
        <TaskList />
      </Layout>
    </TaskProvider>
  );
};

export default Index;