import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  console.log('[useAuth] Hook called');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simple session check - no complex logic
    const checkSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('[useAuth] Session check:', sessionData.session ? 'found' : 'none');
        
        if (sessionData.session?.user) {
          setUser(sessionData.session.user);
          setLoading(false);
          console.log('[useAuth] User loaded, loading false');
        } else {
          setLoading(false);
          console.log('[useAuth] No session, loading false');
        }
      } catch (error) {
        console.error('[useAuth] Session check failed:', error);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  return { session: { user }, user, loading };
}
