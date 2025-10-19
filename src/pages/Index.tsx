"use client";

import Layout from "@/components/Layout";
import { TaskProvider } from "@/context/TaskContext";
import TaskList from "./TaskList";

const Index = () => {
  return (
    <TaskProvider>
      <Layout>
        <TaskList />
      </Layout>
    </TaskProvider>
  );
};

export default Index;