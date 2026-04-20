// Dashboard layout - prevents prerendering of auth-dependent pages
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
