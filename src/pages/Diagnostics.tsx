"use client";

import React from 'react';
import Layout from '@/components/Layout';
import PerformanceDiagnostics from '@/components/PerformanceDiagnostics';

const Diagnostics: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
        <PerformanceDiagnostics />
      </div>
    </Layout>
  );
};

export default Diagnostics;