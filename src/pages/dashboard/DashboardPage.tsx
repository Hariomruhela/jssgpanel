import { useCallback } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  CalendarDays,
  IndianRupee,
  MapPin,
  User,
  UserGroup,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { StatCard } from "@/components/StatCard"
import { StatusBadge } from "@/components/StatusBadge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getDashboardStats,
  getRecentRegistrations,
  getUpcomingEvents,
} from "@/services/api/dashboard"
import { useData } from "@/lib/useData"
import { formatCompact, formatDate, groupIdToName } from "@/lib/format"
import { db } from "@/services/mock/db"
import DashboardBanner from "@/components/DashboardBanner"

export default function DashboardPage() {
  const stats = useData(useCallback(() => getDashboardStats(), []))
  const upcoming = useData(useCallback(() => getUpcomingEvents(), []))
  const pending = useData(useCallback(() => getRecentRegistrations(), []))

  return (
    <div className="space-y-6">
      <DashboardBanner />

      <section>
        <h2 className="mb-4 text-[22px] font-bold text-[#680b0d] dark:text-[#f0c96e]">
          Quick Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={Users}
            label="Total Members"
            value={stats.loading ? "—" : String(stats.data?.totalMembers ?? 0)}
          />
          <StatCard
            icon={UserGroup}
            label="Social Groups"
            value={stats.loading ? "—" : String(stats.data?.activeGroups ?? 0)}
          />
          <StatCard
            icon={User}
            label="Trustees / Officials"
            value={stats.loading ? "—" : String(stats.data?.pendingRegistrations ?? 0)}
          />
          <StatCard
            icon={MapPin}
            label="Total Locations"
            value={stats.loading ? "—" : String(stats.data?.totalLocations ?? 0)}
          />
          <StatCard
            icon={IndianRupee}
            label="Annual Collection"
            value={stats.loading ? "—" : formatCompact(stats.data?.collectedThisYear ?? 0)}
          />
        </div>
      </section>

      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Member Growth</CardTitle>
            <CardDescription>Cumulative member count across FY 2025-26</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              {growth.loading || !growth.data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth.data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip {...chartTooltipProps} />
                    <Area type="monotone" dataKey="members" name="Members" stroke="var(--primary)" strokeWidth={2} fill="url(#growthGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Approval</CardTitle>
            <CardDescription>Monthly application outcomes</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              {trend.loading || !trend.data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={34} />
                    <Tooltip {...chartTooltipProps} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="applied" name="Applied" stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="approved" name="Approved" stackId="a" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fee Collection vs Target</CardTitle>
            <CardDescription>Cumulative annual fee collection (₹ in thousands)</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              {collections.loading || !collections.data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={collections.data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}`} width={40} />
                    <Tooltip {...chartTooltipProps} />
                    <Bar dataKey="collected" name="Collected" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={22} />
                    <Line type="monotone" dataKey="target" name="Target" stroke="var(--chart-4)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Group-wise Collection</CardTitle>
            <CardDescription>Share by social group</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64">
              {groupCollections.loading || !groupCollections.data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupCollections.data}
                      dataKey="collected"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {groupCollections.data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipProps} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div> */}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Registrations</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/registrations">
                  Review <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {pending.loading || !pending.data ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : pending.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No pending registrations</p>
            ) : (
              pending.data.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.regNo} · {r.city} · applied {formatDate(r.appliedOn)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/events">
                  All events <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {upcoming.loading || !upcoming.data ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : upcoming.data.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              upcoming.data.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted leading-none">
                      <CalendarDays className="mb-0.5 size-3.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{e.date.slice(5)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.city} · {groupIdToName(db.groups, e.organizerId)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}