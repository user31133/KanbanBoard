import { useSession, signIn, signOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()
  
  return {
    token: (session as any)?.accessToken as string | undefined,
    user: session?.user,
    isLoading: status === "loading",
    login: () => signIn("github"),
    logout: () => signOut({ callbackUrl: "/" })
  }
}
