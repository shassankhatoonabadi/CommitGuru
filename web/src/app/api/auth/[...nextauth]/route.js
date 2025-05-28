// Route for NextAuth authentication

import NextAuth from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import {
  getUserByEmail,
  getUserByGithubId,
  createGithubUser,
  updateGithubUser,
} from "@/lib/db"

export const authOptions = {
  debug: true,
  // define available authentication providers
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: "https://github.com/login/oauth/authorize?scope=read:user user:email repo",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const user = await getUserByEmail(credentials.email)
        if (!user) throw new Error("No user found")

        const isValid = await compare(credentials.password, user.hashed_password)
        if (!isValid) throw new Error("Incorrect password")

        // return the user object, used to build jwt token
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          image: user.github_avatar_url,
          role: user.role || "viewer",
          isGithubUser: false,
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        const githubId = profile.id.toString()
        const existingUser = await getUserByGithubId(githubId)

        if (!existingUser) {
          const fallbackEmail = profile.email || `${profile.login}@github.local`

          await createGithubUser({
            github_id: githubId,
            github_username: profile.login,
            github_avatar_url: profile.avatar_url,
            github_access_token: account.access_token,
            github_email: fallbackEmail,
            hashedPassword: profile.id,
          })
        } else {
          if (existingUser.github_access_token !== account.access_token) {
            await updateGithubUser({
              github_id: githubId,
              github_username: profile.login,
              github_avatar_url: profile.avatar_url,
              github_access_token: account.access_token,
            })
          }

        }
      }

      return true
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.username = user.username
        token.role = user.role || "developer"
        token.image = user.image
        token.isGithubUser = account?.provider === "github"
      }

      if (account?.provider === "github" && profile?.id) {
        const dbUser = await getUserByGithubId(profile.id.toString())
        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.github_email
          token.name = dbUser.github_username
          token.username = dbUser.github_username
          token.image = dbUser.github_avatar_url
          token.role = dbUser.role || "viewer"
          token.isGithubUser = true
          token.role = dbUser.role || "developer"
        }
      }

      console.log("JWT Token:", token)
      return token
    },

    // called when session is created/used on frontend
    async session({ session, token }) {
      if (!session.user) session.user = {}

      session.user.id = token.id
      session.user.email = token.email
      session.user.username = token.username
      session.user.role = token.role
      session.user.image = token.image
      session.user.isGithubUser = token.isGithubUser

      console.log("Session Object:", session)
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
