import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: { params: { scope: "repo" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: any) {
      // Persist the OAuth access_token and profile info to the token right after signin
      if (account) {
        token.accessToken = account.access_token
      }
      if (profile) {
        token.login = profile.login
        token.html_url = profile.html_url
      }
      return token
    },
    async session({ session, token }: any) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken
      session.user.login = token.login
      session.user.html_url = token.html_url
      return session
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
