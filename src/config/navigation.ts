import type { LucideIcon } from "lucide-react"
import {
  Bell,
  Building2,
  CalendarDays,
  CreditCard,
  FileBarChart,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  MapPin,
  Megaphone,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react"

export interface NavItem {
  title: string
  path: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Members",
    items: [
      { title: "Member Management", path: "/admin/members", icon: Users },
      // { title: "Registration Approval", path: "/admin/registrations", icon: UserCheck },
      { title: "Post Holder Management", path: "/admin/post-holders", icon: Landmark },
      { title: "Group Management", path: "/admin/groups", icon: Building2 },
      // { title: "Location Management", path: "/admin/locations", icon: MapPin },
    ],
  },
  {
    title: "Community",
    items: [
      // { title: "Community Information", path: "/admin/community", icon: FileText },
      { title: "Events Management", path: "/admin/events", icon: CalendarDays },
      { title: "Jain Tirth Management", path: "/admin/jain-tirths", icon: MapPin },
      // { title: "News & Announcements", path: "/admin/news", icon: Newspaper },
      { title: "Notifications", path: "/admin/notifications", icon: Bell },
      { title: "Advertisements", path: "/admin/advertisements", icon: Megaphone },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Roles & Permissions", path: "/admin/roles", icon: ShieldCheck },
      { title: "Reports & Directory", path: "/admin/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Annual Fee Management", path: "/admin/fees", icon: IndianRupee },
      { title: "Payment Module", path: "/admin/payments", icon: CreditCard },
      { title: "Payment Reports", path: "/admin/payment-reports", icon: ReceiptText },
    ],
  },
]

export const ALL_PATHS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.path))