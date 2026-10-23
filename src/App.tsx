import { lazy, Suspense } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AdminLayout } from "@/layouts/AdminLayout"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthProvider, RequireAdmin } from "@/lib/auth"

const AuthLayout = lazy(() => import("@/pages/auth/AuthLayout"))
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"))
const SignupPage = lazy(() => import("@/pages/auth/SignupPage"))

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"))
const MembersPage = lazy(() => import("@/pages/members/MembersPage"))
const RegistrationsPage = lazy(() => import("@/pages/registrations/RegistrationsPage"))
const PostHoldersPage = lazy(() => import("@/pages/post-holders/PostHoldersPage"))
const GroupsPage = lazy(() => import("@/pages/groups/GroupsPage"))
const LocationsPage = lazy(() => import("@/pages/locations/LocationsPage"))
const CommunityInfoPage = lazy(() => import("@/pages/community/CommunityInfoPage"))
const EventsPage = lazy(() => import("@/pages/events/EventsPage"))
const JainTirthsPage = lazy(() => import("@/pages/jain-tirths/JainTirthsPage"))
const NewsPage = lazy(() => import("@/pages/news/NewsPage"))
const NotificationsPage = lazy(() => import("@/pages/notifications/NotificationsPage"))
const AdvertisementsPage = lazy(() => import("@/pages/ads/AdvertisementsPage"))
const RolesPage = lazy(() => import("@/pages/roles/RolesPage"))
const ReportsPage = lazy(() => import("@/pages/reports/ReportsPage"))
const FeesPage = lazy(() => import("@/pages/fees/FeesPage"))
const PaymentsPage = lazy(() => import("@/pages/payments/PaymentsPage"))
const PaymentReportsPage = lazy(() => import("@/pages/payment-reports/PaymentReportsPage"))

/** Panel pages, keyed by their path below /admin. */
const ADMIN_PAGES: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  members: MembersPage,
  registrations: RegistrationsPage,
  "post-holders": PostHoldersPage,
  groups: GroupsPage,
  locations: LocationsPage,
  community: CommunityInfoPage,
  events: EventsPage,
  "jain-tirths": JainTirthsPage,
  news: NewsPage,
  notifications: NotificationsPage,
  advertisements: AdvertisementsPage,
  roles: RolesPage,
  reports: ReportsPage,
  fees: FeesPage,
  payments: PaymentsPage,
  "payment-reports": PaymentReportsPage,
}

function PageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <Suspense fallback={<PageFallback />}>
                  <LoginPage />
                </Suspense>
              }
            />
            <Route
              path="/signup"
              element={
                <Suspense fallback={<PageFallback />}>
                  <SignupPage />
                </Suspense>
              }
            />
          </Route>

          {/* Every admin route sits behind <RequireAdmin>: signed out -> /login,
              signed in without the Admin role -> signed out with an explanation. */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            {Object.entries(ADMIN_PAGES).map(([path, Page]) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Page />
                  </Suspense>
                }
              />
            ))}
          </Route>

          {/* legacy panel links keep working */}
          {Object.keys(ADMIN_PAGES).map((path) => (
            <Route key={path} path={`/${path}`} element={<Navigate to={`/admin/${path}`} replace />} />
          ))}

          {/* the post holders used to be called trustees */}
          <Route path="/trustees" element={<Navigate to="/admin/post-holders" replace />} />
          <Route path="/admin/trustees" element={<Navigate to="/admin/post-holders" replace />} />

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
