"use client";

import React, { useState } from "react";
import Layout from "@/components/Layout";
import { useSession } from "@/context/SessionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const CreateAccount: React.FC = () => {
  const { profile, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"technician" | "contractor">("technician");
  const [loading, setLoading] = useState(false);

  const allowedRoles = ['admin', 'manager', 'supervisor'];
  const isAuthorized = profile && allowedRoles.includes(profile.role);

  if (sessionLoading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading user session...</div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="text-center py-8 text-destructive">You do not have permission to create accounts.</div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user-with-role', {
        body: { email, password, first_name: firstName, last_name: lastName, role },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Account for ${firstName} ${lastName} (${role}) created successfully!`);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("technician");
    } catch (error: any) {
      console.error("Error creating account:", error.message);
      toast.error("Failed to create account: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Create New User Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value: "technician" | "contractor") => setRole(value)} value={role}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
};

export default CreateAccount;