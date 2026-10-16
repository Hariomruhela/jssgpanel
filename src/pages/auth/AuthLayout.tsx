import { useLanguage } from "@/lib/language"
import { ArrowLeft } from "lucide-react"
import { Link, Outlet, useLocation } from "react-router-dom"

export default function AuthLayout() {
  const location = useLocation()
  const isLogin = location.pathname === "/login"
  const { t } = useLanguage()

  return (
    <div className="relative min-h-dvh w-full bg-[#f7f3e9] dark:bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-48 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(197,168,78,0.16)_0%,rgba(197,168,78,0.08)_40%,transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-48 left-[-80px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(23,72,36,0.1)_0%,transparent_70%)] blur-3xl" />
      </div>

      <div className="relative grid min-h-dvh w-full lg:grid-cols-2">
        <aside className="relative hidden flex-col overflow-hidden border-r border-white/10 bg-[#0e351f] lg:flex">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Jain_Temple_of_Ranakpur_01.jpg/1920px-Jain_Temple_of_Ranakpur_01.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
            onError={(e) => {
              // offline / blocked CDN → fall back to the bundled copy
              if (!e.currentTarget.src.endsWith("/jain_temple.png")) {
                e.currentTarget.src = "/jain_temple.png"
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#123f24]/75 via-[#0e351f]/55 to-[#0e351f]/90" />

          <div className="relative flex min-h-full flex-1 flex-col p-8 text-[#f8f4eb]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#a88a38] to-[#c5a84e] font-serif-display text-sm font-semibold text-[#123f24] shadow-md shadow-black/20">
                  JSG
                </div>
                <div className="leading-tight">
                  <p className="text-base font-semibold">{t("JSSG Federation")}</p>
                  <p className="text-xs text-[#c9bd9a]">{t("Admin Panel")}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-10">
              <div className="w-full max-w-md space-y-6 text-center">
                <div className="space-y-4">
                  <p className="font-serif-display text-3xl leading-[1.08] tracking-tight text-white md:text-4xl">
                    {t("Jain Social Group Federation")}
                  </p>
                  <p className="mx-auto max-w-md text-[15px] leading-relaxed text-[#e8dfbc]/90">
                    {t(
                      "A centralized platform to manage members, fee collection, events and community information."
                    )}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-[#d9c98d]/90">
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="size-1.5 rounded-full bg-[#c5a84e]" />
                    <span>{t("Secure, permission-based access")}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="size-1.5 rounded-full bg-[#c5a84e]" />
                    <span>{t("Centralized member and group management")}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="size-1.5 rounded-full bg-[#c5a84e]" />
                    <span>{t("Financial reports and collection tracking")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#c9bd9a]/90">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="size-3.5" />
                {t("Go to dashboard")}
              </Link>
              <p>© {new Date().getFullYear()} {t("JSSG Federation")}</p>
            </div>
          </div>
        </aside>

        <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="absolute right-4 top-4 flex items-center gap-2 lg:hidden">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(150,120,55,0.3)] bg-[#fcfaf5]/80 px-2.5 py-1 text-xs text-[#174824] shadow-sm backdrop-blur transition-colors hover:bg-[#f3ecdb] dark:border-input dark:bg-background/80"
            >
              <ArrowLeft className="size-3.5" />
              {t("Dashboard")}
            </Link>
          </div>

          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <p className="font-serif-display text-2xl leading-tight tracking-tight text-[#174824] dark:text-[#d7e6cf] sm:text-3xl">
                {isLogin ? t("Welcome back") : t("Create a new account")}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? t("Enter your credentials to access the dashboard")
                  : t("Fill in your details to gain access to the federation admin panel")}
              </p>
            </div>

            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}