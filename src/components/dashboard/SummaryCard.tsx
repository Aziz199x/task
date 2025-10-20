"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon: Icon, iconBgColor, iconTextColor }) => {
  const { t } = useTranslation();
  return (
    <Card className="flex-1 min-w-[200px] max-w-[300px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t(title.toLowerCase().replace(/\s/g, '_'))}</CardTitle>
        <div className={`p-2 rounded-full ${iconBgColor} ${iconTextColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;