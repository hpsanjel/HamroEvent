import { supabase } from "@/integrations/supabase/client";

export type UserRole = "organizer" | "superadmin";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // For now, we'll use a simple role system
  // In production, you'd store roles in a separate user_profiles table
  const superadminEmails = [
    "yes.harisanjel@gmail.com",
    // Add your superadmin emails here
  ];
  
  const isSuperadmin = superadminEmails.includes(user.email || "");
  
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || user.email?.split('@')[0],
    role: isSuperadmin ? "superadmin" : "organizer",
    is_active: true,
    created_at: user.created_at,
    last_login: user.last_sign_in_at,
  };
}

export function isSuperAdmin(user: UserProfile | null): boolean {
  return user?.role === "superadmin";
}

export function canAccessSuperAdmin(user: UserProfile | null): boolean {
  return isSuperAdmin(user);
}
