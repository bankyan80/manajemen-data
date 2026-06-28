import NextAuth from 'next-auth/next'
import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users, schools } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { Role } from '../types'

async function findUserByUsername(username: string) {
  if (!db) return null
  try {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return result[0] || null
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await findUserByUsername(credentials.username)
        if (!user) return null
        if (!user.is_active) return null

        const isValid = bcrypt.compareSync(credentials.password, user.password)
        if (!isValid) return null

        let sekolah_jenjang: string | null = null
        if (db && user.sekolah_id) {
          try {
            const school = await db.select({ jenjang: schools.jenjang }).from(schools).where(eq(schools.id, user.sekolah_id)).limit(1)
            sekolah_jenjang = school[0]?.jenjang || null
          } catch {}
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || '',
          role: user.role as Role,
          sekolah_id: user.sekolah_id,
          pegawai_id: user.pegawai_id,
          sekolah_jenjang,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role as Role
        token.sekolah_id = (user as any).sekolah_id
        token.pegawai_id = (user as any).pegawai_id
        token.sekolah_jenjang = (user as any).sekolah_jenjang
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role as Role
        ;(session.user as any).sekolah_id = token.sekolah_id
        ;(session.user as any).pegawai_id = token.pegawai_id
        ;(session.user as any).sekolah_jenjang = token.sekolah_jenjang
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

const handler = NextAuth(authOptions)

export const handlers = { GET: handler, POST: handler }

export async function auth() {
  return getServerSession(authOptions)
}

export default auth

export { signIn, signOut } from 'next-auth/react'

export async function requireApiAuth() {
  const session = await getServerSession(authOptions)
  return session
}
