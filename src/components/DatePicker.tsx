"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "react-i18next";
import useIsDesktop from "@/hooks/use-is-desktop";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "./ui/skeleton";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePicker({ date, onDateChange, disabled, placeholder }: DatePickerProps) {
  const { t } = useTranslation();
  const isMobile = !useIsDesktop();
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  if (!isClientLoaded) {
    return <Skeleton className="w-full h-10" />;
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setOpen(false);
  };

  const trigger = (
    <Button
      variant={"outline"}
      className={cn(
        "w-full justify-start text-left font-normal",
        !date && "text-muted-foreground"
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : <span>{placeholder || t("pick_a_date")}</span>}
    </Button>
  );

  const calendarContent = (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      disabled={disabled}
      initialFocus
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-start">
            <DrawerTitle>{placeholder || t("pick_a_date")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex justify-center p-4 pb-10">
            {calendarContent}
          </div>
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