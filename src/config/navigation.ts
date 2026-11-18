import type { LucideIcon } from "lucide-react"
import {
  Building2,
  CalendarDays,
  // FileBarChart,
  Image as ImageIcon,
  IndianRupee,
  Landmark,
  LayoutDashboard,
  // MapPin,
  Megaphone,
  // Settings,
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
    title: "Menu",
    items: [
      { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Members", path: "/admin/members", icon: Users },
      { title: "Events", path: "/admin/events", icon: CalendarDays },
      { title: "Advertisement", path: "/admin/advertisements", icon: Megaphone },
      { title: "Jain Tirth", path: "/admin/jain-tirths", icon: ImageIcon },
      // { title: "Reports", path: "/admin/reports", icon: FileBarChart },
      // { title: "Settings", path: "/admin/roles", icon: Settings },
      { title: "Post Holders", path: "/admin/post-holders", icon: Landmark },
      { title: "Groups", path: "/admin/groups", icon: Building2 },
      // { title: "Tirth Locations", path: "/admin/locations", icon: MapPin },
      { title: "Payments", path: "/admin/payments", icon: IndianRupee },
    ],
  },
  // {
  //   title: "Management & Finance",
  //   items: [
  //     { title: "Post Holders", path: "/admin/post-holders", icon: Landmark },
  //     { title: "Groups", path: "/admin/groups", icon: Building2 },
  //     { title: "Tirth Locations", path: "/admin/locations", icon: MapPin },
  //     { title: "Payments", path: "/admin/payments", icon: IndianRupee },
  //   ],
  // },
]

export const ALL_PATHS = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.path))
