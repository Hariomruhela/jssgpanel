import { useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Bell, LogOut, Menu, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { ALL_PATHS, NAV_SECTIONS } from "@/config/navigation"
import { useLanguage } from "@/lib/language"
import { useAuth } from "@/lib/auth"

function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a88a38] to-[#c5a84e] font-serif-display text-sm font-semibold text-[#123f24] shadow-md shadow-black/20">
        JSG
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold text-[#f8f4eb]">{t("JSSG Federation")}</p>
          <p className="text-[11px] text-[#c9bd9a]">{t("Admin Panel")}</p>
        </div>
      )}
    </div>
  )
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const { t } = useLanguage()
  return (
    <div className="sidebar-nav flex min-h-0 flex-1 flex-col gap-6 px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="space-y-1">
          <p className="px-2 text-[11px] font-semibold tracking-wider text-[#d9c98d]/80 uppercase">
            {t(section.title)}
          </p>
          {section.items.map((item) => {
            const isActive =
              item.path === "/admin/dashboard" ? pathname === item.path : pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={cn(
                  "sidebar-item group flex items-center gap-2.5 rounded-[10px] px-2.5 py-1.5 text-sm",
                  isActive ? "active font-medium" : ""
                )}
              >
                <item.icon className="size-4 shrink-0" />
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
  return <div className="border-t border-white/10 p-3" />
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const section = NAV_SECTIONS.find((s) => s.items.some((i) => i.path === pathname))
  const current =
    section?.items.find((i) => (i.path === "/admin/dashboard" ? pathname === i.path : pathname.startsWith(i.path)))

  const name = user?.full_name || t("Admin")

  const handleSignOut = () => {
    signOut()
    toast.success(t("Signed out"))
    navigate("/login", { replace: true })
  }

  return (
    <div className="dashboard-background min-h-dvh">
      <aside className="sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 lg:flex">
        <div className="flex h-14 items-center border-b border-white/10 px-4">
          <Logo />
        </div>
        <NavContent />
        <SidebarFooter />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[rgba(150,120,55,0.2)] bg-[#f7f3e9]/85 px-4 backdrop-blur dark:bg-background/85 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t("Open menu")}>
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sidebar w-72 gap-0 border-0 p-0">
                <SheetTitle className="sr-only">{t("Navigation")}</SheetTitle>
                <div className="flex h-14 items-center border-b border-white/10 px-4">
                  <Logo />
                </div>
                <NavContent onNavigate={() => setMobileOpen(false)} />
                <SidebarFooter />
              </SheetContent>
            </Sheet>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-[#174824] dark:text-[#d7e6cf]">{t(current?.title ?? "Dashboard")}</p>
              <p className="truncate text-[11px] text-[#918777] dark:text-[#cbb37a]">{t(section?.title ?? "Overview")}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button variant="ghost" size="icon" className="relative" aria-label={t("Notifications")}>
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#c5a84e]" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-1.5">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm sm:inline">{name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user?.email || user?.phone_number || ""}
                    </span>
                    {user?.role?.name && (
                      <span className="text-xs font-normal text-muted-foreground">{user.role.name}</span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="size-4" />
                  {t("Account settings")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                  <LogOut className="size-4" />
                  {t("Sign out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
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