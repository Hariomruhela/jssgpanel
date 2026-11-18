import { useState } from "react"
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { ALL_PATHS, NAV_SECTIONS, type NavSection } from "@/config/navigation"
import { isGroupAdminRole } from "@/services/api/session"
import { useLanguage } from "@/lib/language"
import { useAuth } from "@/lib/auth"
import { LotusIcon } from "@/components/LotusIcon"

function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3E2B1F]/60 border border-[#C5A059]/30 p-1 shadow-xs">
        <img
          src="/hand_icon.png"
          alt="Hand Icon"
          className="size-7 object-contain select-none"
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="font-serif-display text-sm font-bold tracking-tight text-white">
            {t("JSSG Jain Community")}
          </p>
          <p className="text-[11px] text-[#C5B39A] font-medium">{t("Admin Panel")}</p>
        </div>
      )}
    </div>
  )
}

function visibleSections(user: ReturnType<typeof useAuth>["user"]): NavSection[] {
  if (!isGroupAdminRole(user)) return NAV_SECTIONS
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.path === "/admin/advertisements"),
  })).filter((section) => section.items.length > 0)
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  const { user } = useAuth()
  const sections = visibleSections(user)

  return (
    <div className="sidebar-nav flex min-h-0 flex-1 flex-col gap-4 px-3 py-4">
      {sections.map((section, idx) => (
        <div key={section.title} className="space-y-1">
          {idx > 0 && (
            <p className="px-2 pt-2 text-[10px] font-semibold tracking-wider text-[#C5A059]/70 uppercase">
              {t(section.title)}
            </p>
          )}
          {section.items.map((item) => {
            const isActive =
              item.path === "/admin/dashboard"
                ? pathname === item.path
                : pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "sidebar-item group flex items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150",
                  isActive
                    ? "active font-semibold text-white bg-[#3E2B1F] border border-[#C5A059]/30 shadow-md shadow-black/20"
                    : "text-[#D5C7B8] hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? "text-[#E8DCC8]" : "text-[#B8A796] group-hover:text-white"
                  )}
                />
                <span className="truncate">{t(item.title)}</span>
              </NavLink>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t border-white/10 p-4 text-center select-none">
      <div className="flex flex-col items-center justify-center gap-1.5 text-[#C5A059]">
        <LotusIcon className="size-6 text-[#C5A059]" />
        <div className="flex items-center gap-2 text-xs">
          <span className="h-px w-4 bg-[#C5A059]/40" />
          <span className="font-serif-display tracking-wider text-xs text-[#E8DCC8]">
            Jai Jinendra
          </span>
          <span className="h-px w-4 bg-[#C5A059]/40" />
        </div>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const sections = visibleSections(user)
  const section = sections.find((s) => s.items.some((i) => i.path === pathname))
  const current = section?.items.find((i) =>
    i.path === "/admin/dashboard" ? pathname === i.path : pathname.startsWith(i.path)
  )

  const name = user?.full_name || t("Admin")
  const groupAdminOutsideAds =
    isGroupAdminRole(user) && !pathname.startsWith("/admin/advertisements")

  const handleSignOut = () => {
    signOut()
    toast.success(t("Signed out"))
    navigate("/login", { replace: true })
  }

  if (groupAdminOutsideAds) {
    return <Navigate to="/admin/advertisements" replace />
  }

  return (
    <div className="dashboard-background min-h-dvh">
      {/* Desktop Sidebar */}
      <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 lg:flex shadow-xl shadow-black/10">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Logo />
        </div>
        <NavContent />
        <SidebarFooter />
      </aside>

      <div className="lg:pl-64">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#ECE5D8] bg-white/95 px-4 backdrop-blur sm:px-6 shadow-[0_1px_4px_rgba(43,30,22,0.02)]">
          {/* Left section: Mobile menu + Search bar */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-[#2B1E16]"
                  aria-label={t("Open menu")}
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sidebar w-72 gap-0 border-0 p-0">
                <SheetTitle className="sr-only">{t("Navigation")}</SheetTitle>
                <div className="flex h-16 items-center border-b border-white/10 px-5">
                  <Logo />
                </div>
                <NavContent onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>

            {/* Global Search Bar (matches screenshot) */}
            <div className="relative hidden sm:flex items-center w-72 md:w-96">
              <Input
                type="search"
                placeholder={t("Search members, events, or anything...")}
                className="h-9 w-full rounded-lg border-[#E2D9CC] bg-[#FAF8F5] pl-3 pr-9 text-xs placeholder:text-[#9C8C7D] focus-visible:border-[#8C6D46] focus-visible:ring-1 focus-visible:ring-[#8C6D46]"
              />
              <Search className="absolute right-3 size-4 text-[#8C7A6B] pointer-events-none" />
            </div>

            {/* Mobile title */}
            <div className="min-w-0 sm:hidden">
              <p className="truncate text-sm font-semibold text-[#2B1E16]">
                {t(current?.title ?? "Dashboard")}
              </p>
            </div>
          </div>

          {/* Right section: Notification Bell with Badge + Admin Avatar Menu */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-[#3D2B1F] hover:bg-[#FAF6EE] rounded-lg"
              aria-label={t("Notifications")}
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2 right-2 flex size-3.5 items-center justify-center rounded-full bg-[#E53935] text-[9px] font-bold text-white">
                3
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 hover:bg-[#FAF6EE] rounded-lg text-[#2B1E16]"
                >
                  <Avatar className="size-8 rounded-full bg-[#2B1E16] text-white border border-[#C5A059]/30">
                    <AvatarFallback className="bg-[#2B1E16] text-white font-semibold text-xs">
                      {initials(name) || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-xs font-semibold sm:inline">{name}</span>
                  <ChevronDown className="size-3.5 text-[#8C7A6B]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 border-[#E8DFD1] bg-white">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-[#2B1E16]">{name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.email || user?.phone_number || ""}
                    </span>
                    {user?.role?.name && (
                      <span className="text-xs font-normal text-[#8C6D46]">
                        {user.role.name}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E8DFD1]" />
                <DropdownMenuItem className="cursor-pointer text-[#2B1E16]">
                  <Settings className="size-4" />
                  {t("Account settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleSignOut}
                  className="cursor-pointer"
                >
                  <LogOut className="size-4" />
                  {t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={cn("main-content w-full px-4 py-6 sm:px-6 lg:py-8")}>
          <div key={pathname} className="animate-in fade-in slide-in-from-bottom-1 duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export { ALL_PATHS }
