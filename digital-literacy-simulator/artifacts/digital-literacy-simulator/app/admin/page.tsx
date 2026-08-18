import { AdminAnalytics } from '@/components/admin-analytics'
import { AdminLogin } from '@/components/admin-login'
import { hasAdminSession } from '@/lib/admin-auth'

export const metadata = {
  title: 'Research Analytics | Digital Literacy Simulator',
  description: 'Facilitator analytics for the Digital Literacy Simulator.',
}

export default async function AdminPage() {
  return (await hasAdminSession()) ? <AdminAnalytics /> : <AdminLogin />
}
