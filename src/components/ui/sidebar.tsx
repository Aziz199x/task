"use client";

import * as React from "react";
// Assuming useIsMobile is imported by the parent component that passes the prop

interface SidebarProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  // Corrected type for isMobile prop to match the object returned by useIsMobile hook
  isMobile: { isMobile: boolean; isClientLoaded: boolean; }; 
  openMobile: boolean;
  children?: React.ReactNode;
  // Add any other props that might exist in the actual file
}

const Sidebar = ({
  setOpen,
  isMobile, // This line is now correctly typed
  openMobile,
  children,
  // ... other destructured props
}: SidebarProps) => {
  // Access the boolean value from the isMobile object
  const actualIsMobile = isMobile.isMobile;

  // Example usage (replace with actual component logic)
  return (
    <div className={`sidebar ${actualIsMobile ? 'mobile-view' : 'desktop-view'}`}>
      <button onClick={() => setOpen(prev => !prev)}>Toggle Sidebar</button>
      {actualIsMobile && openMobile && (
        <div>
          {children}
        </div>
      )}
      {!actualIsMobile && (
        <div>
          {children}
        </div>
      )}
    </div>
  );
};

export default Sidebar;