import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { setCustomHeadersGetter, useGetCurrentUser, useListUsers } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface TeamAuthContextValue {
  currentUser: User | null;
  allUsers: User[];
  userMap: Map<string, User>;
  isLoading: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const TeamAuthContext = createContext<TeamAuthContextValue>({
  currentUser: null,
  allUsers: [],
  userMap: new Map(),
  isLoading: true,
  userId: null,
  setUserId: () => {},
});

function initHeaders(id: string | null) {
  setCustomHeadersGetter(id ? () => ({ "x-user-id": id }) : null);
}

const storedUserId = localStorage.getItem("team-user-id");
if (storedUserId) {
  initHeaders(storedUserId);
}

export function TeamAuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<string | null>(storedUserId);

  const setUserId = (id: string | null) => {
    if (id) {
      localStorage.setItem("team-user-id", id);
    } else {
      localStorage.removeItem("team-user-id");
    }
    initHeaders(id);
    setUserIdState(id);
  };

  const { data: currentUser, isLoading: userLoading } = useGetCurrentUser({
    query: { enabled: !!userId },
  });

  const { data: allUsers, isLoading: usersLoading } = useListUsers({
    query: { enabled: !!userId },
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
        isLoading: userLoading || usersLoading,
        userId,
        setUserId,
      }}
    >
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  return useContext(TeamAuthContext);
}
