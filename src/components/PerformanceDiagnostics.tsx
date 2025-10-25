"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';

const PerformanceDiagnostics: React.FC = () => {
  const [latency, setLatency] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [supabaseRegion, setSupabaseRegion] = useState<string>('');

  useEffect(() => {
    // Extract region from Supabase URL
    const url = import.meta.env.VITE_SUPABASE_URL || '';
    const match = url.match(/https:\/\/[^.]+\.supabase\.co/);
    if (match) {
      setSupabaseRegion(url);
    }
  }, []);

  const testLatency = async () => {
    setTesting(true);
    const start = performance.now();
    
    try {
      await supabase.from('tasks').select('id').limit(1);
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (error) {
      console.error('Latency test failed:', error);
      setLatency(null);
    }
    
    setTesting(false);
  };

  const getLatencyStatus = () => {
    if (latency === null) return { color: 'text-gray-500', icon: AlertCircle, text: 'Not tested' };
    if (latency < 100) return { color: 'text-green-600', icon: CheckCircle, text: 'Excellent' };
    if (latency < 300) return { color: 'text-yellow-600', icon: Activity, text: 'Good' };
    if (latency < 500) return { color: 'text-orange-600', icon: AlertCircle, text: 'Fair' };
    return { color: 'text-red-600', icon: AlertCircle, text: 'Poor' };
  };

  const status = getLatencyStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">Supabase URL:</p>
          <p className="text-xs text-muted-foreground break-all">{supabaseRegion || 'Not configured'}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-1">Database Latency:</p>
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${status.color}`} />
            <span className={`text-lg font-bold ${status.color}`}>
              {latency !== null ? `${latency}ms` : 'N/A'}
            </span>
            <span className={`text-sm ${status.color}`}>({status.text})</span>
          </div>
        </div>

        <Button onClick={testLatency} disabled={testing} className="w-full">
          {testing ? 'Testing...' : 'Test Connection Speed'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
          <p className="font-semibold">Recommendations:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Supabase region should match your Vercel deployment region</li>
            <li>Target latency: &lt;100ms (Excellent), &lt;300ms (Good)</li>
            <li>If latency &gt;500ms, consider changing regions</li>
          </ul>
        </div>

        <div className="text-xs text-muted-foreground space-y-2 pt-2">
          <p className="font-semibold">How to check/change regions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Supabase: Project Settings → General → Region</li>
            <li>Vercel: Project Settings → General → Deployment Region</li>
            <li>Common regions: us-east-1, eu-west-1, ap-southeast-1</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceDiagnostics;