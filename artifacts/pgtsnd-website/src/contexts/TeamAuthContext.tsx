import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { useGetCurrentUser, useListUsers } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface TeamAuthContextValue {
  currentUser: User | null;
  allUsers: User[];
  userMap: Map<string, User>;
  isLoading: boolean;
  userId: string | null;
}

const TeamAuthContext = createContext<TeamAuthContextValue>({
  currentUser: null,
  allUsers: [],
  userMap: new Map(),
  isLoading: true,
  userId: null,
});

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ? String(user.id) : null;
  const isAuthenticated = !!user;

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser({
    query: { enabled: isAuthenticated },
  });

  const { data: allUsers, isLoading: usersLoading } = useListUsers({
    query: { enabled: isAuthenticated },
  });

  const userMap = new Map<string, User>();
  if (allUsers) {
    for (const u of allUsers) {
      userMap.set(u.id, u);
    }
  }

  return (
    <TeamAuthContext.Provider
      value={{
        currentUser: currentUser ?? null,
        allUsers: allUsers ?? [],
        userMap,
        isLoading: authLoading || userLoading || usersLoading,
        userId,
      }}
    >
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  return useContext(TeamAuthContext);
}
