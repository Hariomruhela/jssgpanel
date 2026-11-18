import { useCallback } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  CalendarPlus,
  FileText,
  Megaphone,
  User,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { StatCard } from "@/components/StatCard"
import {
  getDashboardStats,
  getRecentRegistrations,
  getUpcomingEvents,
} from "@/services/api/dashboard"
import { useData } from "@/lib/useData"
import { formatDate } from "@/lib/format"
import DashboardBanner from "@/components/DashboardBanner"
import { LotusIcon } from "@/components/LotusIcon"

// Default mock events matching the screenshot
const DEFAULT_EVENTS = [
  {
    id: "evt-1",
    date: "05 Nov 2026",
    title: "Paryushan Mahaparva",
    venue: "Community Hall",
    status: "Upcoming",
  },
  {
    id: "evt-2",
    date: "12 Nov 2026",
    title: "Satsang Sabha",
    venue: "Temple",
    status: "Upcoming",
  },
  {
    id: "evt-3",
    date: "20 Nov 2026",
    title: "Youth Connect",
    venue: "Community Hall",
    status: "Upcoming",
  },
  {
    id: "evt-4",
    date: "28 Nov 2026",
    title: "Matri Bhoj",
    venue: "Temple",
    status: "Upcoming",
  },
]

// Recent activities matching the screenshot
const RECENT_ACTIVITIES = [
  {
    id: "act-1",
    title: "New member registered",
    detail: "Rahul Shah",
    time: "2 hours ago",
    icon: User,
    iconBg: "bg-slate-100",
    iconColor: "text-slate-700",
  },
  {
    id: "act-2",
    title: "Event created",
    detail: "Samayik Satsang",
    time: "4 hours ago",
    icon: Calendar,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-700",
  },
  {
    id: "act-3",
    title: "Announcement published",
    detail: "Paryushan Mahaparva Details",
    time: "6 hours ago",
    icon: Megaphone,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  {
    id: "act-4",
    title: "Member updated",
    detail: "Meena Jain",
    time: "8 hours ago",
    icon: UserCheck,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
]

export default function DashboardPage() {
  const stats = useData(useCallback(() => getDashboardStats(), []))
  const upcoming = useData(useCallback(() => getUpcomingEvents(), []))
  const pending = useData(useCallback(() => getRecentRegistrations(), []))

  // Dynamically map events or use the design mock events
  const displayEvents =
    upcoming.data && upcoming.data.length > 0
      ? upcoming.data.slice(0, 4).map((e, idx) => ({
          id: e.id || `evt-${idx}`,
          date: formatDate(e.date),
          title: e.title,
          venue: e.city || "Community Hall",
          status: "Upcoming",
        }))
      : DEFAULT_EVENTS

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <DashboardBanner />

      {/* Row of 4 Stat Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={stats.data?.totalMembers ? stats.data.totalMembers.toLocaleString() : "1,248"}
          trend="12%"
          trendLabel="vs. last month"
          iconBg="bg-amber-100/80"
          iconColor="text-amber-800"
        />
        <StatCard
          icon={CalendarDays}
          label="Upcoming Events"
          value={upcoming.data?.length ? String(upcoming.data.length) : "8"}
          trend="33%"
          trendLabel="vs. last month"
          iconBg="bg-purple-100/80"
          iconColor="text-purple-700"
        />
        <StatCard
          icon={Megaphone}
          label="Total Announcements"
          value={stats.data?.activeGroups ? String(stats.data.activeGroups) : "15"}
          trend="20%"
          trendLabel="vs. last month"
          iconBg="bg-emerald-100/80"
          iconColor="text-emerald-700"
        />
        <StatCard
          icon={Users}
          label="Active Volunteers"
          value={
            pending.data?.length
              ? String(pending.data.length)
              : stats.data?.pendingRegistrations
                ? String(stats.data.pendingRegistrations)
                : "52"
          }
          trend="8%"
          trendLabel="vs. last month"
          iconBg="bg-amber-100/80"
          iconColor="text-amber-800"
        />
      </section>

      {/* Main Grid: Left Column (Upcoming Events) + Right Column (Activities & Quick Links) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Upcoming Events Table (approx 7 of 12 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(43,30,22,0.03)] h-full flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
                <h2 className="font-serif-display text-base font-bold tracking-tight text-[#2B1E16]">
                  Upcoming Events
                </h2>
                <Link
                  to="/admin/events"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D46] hover:text-[#3D2B1F] hover:underline"
                >
                  View all <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#F2ECE3] text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Event Name</th>
                      <th className="py-3 px-2">Venue</th>
                      <th className="py-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F1EA]">
                    {displayEvents.map((evt) => (
                      <tr key={evt.id} className="transition-colors hover:bg-[#FAF8F5]">
                        <td className="py-3.5 px-2 text-[#7C6C5E] whitespace-nowrap">
                          {evt.date}
                        </td>
                        <td className="py-3.5 px-2 font-medium text-[#2B1E16] whitespace-nowrap">
                          {evt.title}
                        </td>
                        <td className="py-3.5 px-2 text-[#7C6C5E] whitespace-nowrap">
                          {evt.venue}
                        </td>
                        <td className="py-3.5 px-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2E7D32]">
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activities + Quick Links (approx 5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Activities Card */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(43,30,22,0.03)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
              <h2 className="font-serif-display text-base font-bold tracking-tight text-[#2B1E16]">
                Recent Activities
              </h2>
              <Link
                to="/admin/members"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D46] hover:text-[#3D2B1F] hover:underline"
              >
                View all <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-[#F6F1EA] pt-1">
              {RECENT_ACTIVITIES.map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${act.iconBg} ${act.iconColor}`}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-xs font-semibold text-[#2B1E16]">
                          {act.title}
                        </p>
                        <p className="truncate text-[11px] text-[#7C6C5E]">{act.detail}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-[#A09385] whitespace-nowrap">
                      {act.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-2xl border border-[#E8DFD1] bg-white p-5 sm:p-6 shadow-[0_2px_10px_rgba(43,30,22,0.03)]">
            <div className="pb-3 border-b border-[#F0EAE1]">
              <h2 className="font-serif-display text-base font-bold tracking-tight text-[#2B1E16]">
                Quick Links
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link
                to="/admin/members"
                className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD1] bg-[#FAF8F5] p-3 text-xs font-medium text-[#2B1E16] transition-all hover:bg-[#F2ECE0] hover:border-[#D0C2AE] shadow-2xs"
              >
                <UserPlus className="size-4 text-[#8C6D46]" />
                <span className="truncate">Add Member</span>
              </Link>

              <Link
                to="/admin/events"
                className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD1] bg-[#FAF8F5] p-3 text-xs font-medium text-[#2B1E16] transition-all hover:bg-[#F2ECE0] hover:border-[#D0C2AE] shadow-2xs"
              >
                <CalendarPlus className="size-4 text-[#8C6D46]" />
                <span className="truncate">Create Event</span>
              </Link>

              <Link
                to="/admin/advertisements"
                className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD1] bg-[#FAF8F5] p-3 text-xs font-medium text-[#2B1E16] transition-all hover:bg-[#F2ECE0] hover:border-[#D0C2AE] shadow-2xs"
              >
                <Megaphone className="size-4 text-[#8C6D46]" />
                <span className="truncate">Post Announcement</span>
              </Link>

              <Link
                to="/admin/reports"
                className="flex items-center gap-2.5 rounded-xl border border-[#E8DFD1] bg-[#FAF8F5] p-3 text-xs font-medium text-[#2B1E16] transition-all hover:bg-[#F2ECE0] hover:border-[#D0C2AE] shadow-2xs"
              >
                <FileText className="size-4 text-[#8C6D46]" />
                <span className="truncate">View Reports</span>
              </Link>
            </div>

            {/* Bottom Footer inside Quick Links (matches screenshot) */}
            <div className="pt-4 flex items-center justify-center gap-1.5 text-xs text-[#A08B77] select-none">
              <LotusIcon className="size-3.5 text-[#C5A059]" />
              <span className="font-serif-display text-[11px] tracking-wide">Jai Jinendra</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
