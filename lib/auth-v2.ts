import NextAuth from 'next-auth/next'
import { getServerSession } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

async function findUserByEmail(email: string) {
  if (!db) return null
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
    return result[0] || null
  } catch { return null }
}

async function findUserByUsername(username: string) {
  if (!db) return null
  try {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return result[0] || null
  } catch { return null }
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
        if (!credentials?.username || !credentials?.password) return null
        const user = await findUserByUsername(credentials.username)
        if (!user || !user.is_active) return null
        const isValid = bcrypt.compareSync(credentials.password, user.password)
        if (!isValid) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email || '',
          role: mapRole(user.role),
          sekolah_id: user.sekolah_id,
          pegawai_id: user.pegawai_id,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = mapRole((user as unknown as Record<string, unknown>).role as string)
        token.sekolah_id = (user as unknown as Record<string, unknown>).sekolah_id as string
        token.pegawai_id = (user as unknown as Record<string, unknown>).pegawai_id as string
      }
      if (account?.provider === 'google') {
        const existingUser = await findUserByEmail(token.email!)
        if (existingUser) {
          token.id = existingUser.id
          token.role = mapRole(existingUser.role)
          token.sekolah_id = existingUser.sekolah_id
          token.pegawai_id = existingUser.pegawai_id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>
        u.id = token.id
        u.role = token.role
        u.sekolah_id = token.sekolah_id
        u.pegawai_id = token.pegawai_id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
}

function mapRole(role: string | undefined): string {
  if (role === 'admin_kecamatan') return 'admin_kecamatan'
  if (role === 'operator_sekolah') return 'operator_sekolah'
  return 'guru_tendik'
}

const handler = NextAuth(authOptions)
export const handlers = { GET: handler, POST: handler }
export async function auth() { return getServerSession(authOptions) }
export default auth
export { signIn, signOut } from 'next-auth/react'

export async function requireApiAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return null
  return session
}
