"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton"; // Use Skeleton for initial render placeholder

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePicker({ date, setDate, disabled = false, placeholder }: DatePickerProps) {
  const { t } = useTranslation();
  const { isMobile, isClientLoaded } = useIsMobile();
  const [open, setOpen] = React.useState(false);
  
  // Set the minimum selectable date to today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setOpen(false);
  };

  const trigger = (
    <Button
      variant={"outline"}
      className={cn(
        "w-full justify-start text-start font-normal",
        !date && "text-muted-foreground"
      )}
      disabled={disabled || !isClientLoaded}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : (placeholder || t("pick_a_date"))}
    </Button>
  );

  const calendarContent = (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleSelect}
      // Removed initialFocus prop
      disabled={(day) => day < today}
      fromDate={today}
    />
  );

  // If client hasn't loaded yet, render a placeholder to avoid hydration mismatch
  if (!isClientLoaded) {
    return <Skeleton className="w-full h-10" />;
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>{placeholder || t("pick_a_date")}</DrawerTitle>
          </DrawerHeader>
          {/* Ensure calendar is centered and has padding for mobile */}
          <div className="flex justify-center p-4 pb-10">
            {calendarContent}
          </div >
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        {calendarContent}
      </PopoverContent>
    </Popover>
  );
}