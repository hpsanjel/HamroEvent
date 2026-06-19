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

  // Try to load profile from the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  
  if (profile) {
    // Update last_login on every session check
    supabase.from("profiles").update({ last_login: new Date().toISOString() }).eq("id", user.id).then();
    
    return {
      id: profile.id,
      email: profile.email || user.email || "",
      name: profile.name || user.user_metadata?.name || user.email?.split('@')[0],
      role: profile.role as UserRole,
      is_active: profile.is_active,
      created_at: profile.created_at,
      last_login: profile.last_login ?? undefined,
    };
  }

  // Fallback: derive role from hardcoded emails (legacy support)
  const superadminEmails = [
    "yes.harisanjel@gmail.com",
  ];
  
  const isSuperadmin = superadminEmails.includes(user.email || "");
  
  // Auto-create profile on first access
  if (user.email) {
    const newProfile = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email.split('@')[0],
      role: isSuperadmin ? "superadmin" : "organizer",
      is_active: true,
      created_at: user.created_at,
      last_login: user.last_sign_in_at,
    };
    supabase.from("profiles").upsert(newProfile).then();
  }
  
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
