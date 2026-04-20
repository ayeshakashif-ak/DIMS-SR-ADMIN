import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to login page for admin portal
  redirect('/login')
}