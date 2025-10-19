"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { LogOut, LayoutDashboard, ListTodo } from "lucide-react"; // Import new icons
import { Link } from "react-router-dom"; // Import Link for navigation

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { session, user, profile, signOut } = useSession();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Task Manager</h1>
          {session && (
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="text-sm hidden md:block"> {/* Hide on small screens */}
                  <p className="font-medium">{profile.first_name || user?.email}</p>
                  <p className="text-xs opacity-80 capitalize">{profile.role}</p>
                </div>
              )}
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <ListTodo className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;