import { Outlet } from "react-router-dom"
import { LotusIcon } from "@/components/LotusIcon"

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen lg:h-screen w-full bg-[#FAF8F5] text-[#2B1E16] lg:overflow-hidden flex flex-col lg:flex-row">
      {/* =========================================================================
          LEFT PANE: Clean Temple Scenery + Crisp Vector HTML Typography Overlay
          The text NEVER cuts on any screen (1024px, 1080p, 4K, laptops, mobile).
         ========================================================================= */}
      <aside className="relative hidden lg:flex flex-col justify-between w-[52%] xl:w-[55%] h-full min-h-screen overflow-hidden select-none shrink-0 p-8 xl:p-12">
        {/* Clean Temple Scenery: object-left ensures the left part (pillar & temple) is shown */}
        <img
          src="/background_temple_image.png"
          alt="Jain Temple Scenery"
          className="absolute inset-0 size-full object-cover object-center select-none"
        />

        {/* Smooth warm vignette & ivory fade towards the right login form */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-[#FAF8F5]/60 pointer-events-none" />

        {/* Top spacer */}
        <div className="relative z-10" />

        {/* Central Branded Typography Overlay (Directly matching the mockup) */}
        <div className="relative z-10 my-auto ml-auto max-w-[420px] text-center pr-2 xl:pr-6">
          {/* Ahimsa Hand Icon */}
          <div className="flex justify-center mb-3">
            <img
              src="/hand_icon.png"
              alt="Ahimsa Hand Symbol"
              className="h-14 w-auto object-contain drop-shadow-sm select-none"
            />
          </div>

          {/* Titles */}
          <h1 className="font-serif-display text-2xl xl:text-3xl font-bold tracking-tight text-[#2B1E16] drop-shadow-xs">
            JSSG Jain Community
          </h1>
          <p className="mt-1 text-sm xl:text-base font-semibold text-[#6E553F]">
            Admin Panel
          </p>

          {/* Tagline */}
          <div className="mt-3.5 flex items-center justify-center gap-2 text-[10px] xl:text-[11px] font-bold tracking-[0.22em] text-[#8C6D46] uppercase">
            <span>UNITY</span>
            <span>•</span>
            <span>SERVICE</span>
            <span>•</span>
            <span>SPIRITUAL GROWTH</span>
          </div>

          {/* Sacred Jain Forgiveness Quote */}
          <div className="mt-6 pt-5 border-t border-[#8C6D46]/25">
            <p className="font-serif-display text-base xl:text-lg italic font-semibold text-[#3D2B1F]">
              “Micchāmi Dukkaḍaṃ”
            </p>
            <p className="mt-1 text-xs xl:text-sm text-[#5C4836] font-medium">
              May all be happy. May all be free from suffering.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-[#B88B4A]">
              <span className="h-px w-8 bg-[#B88B4A]/50" />
              <LotusIcon className="size-3.5 text-[#B88B4A]" />
              <span className="h-px w-8 bg-[#B88B4A]/50" />
            </div>
          </div>
        </div>

        {/* Bottom subtle copyright note */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-[#4A3828]/80 font-medium">
          <p>© {new Date().getFullYear()} JSSG Jain Community</p>
          <p>Federation Portal</p>
        </div>
      </aside>

      {/* MOBILE TOP BANNER: For screens < 1024px */}
      <div className="w-full lg:hidden relative aspect-[16/9] max-h-[200px] shrink-0 overflow-hidden bg-[#FAF8F5] border-b border-[#E8DFD1]/80">
        <img
          src="/background_temple_image.png"
          alt="JSSG Jain Community"
          className="size-full object-cover object-left select-none"
        />
        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center text-white text-center p-4">
          <img src="/hand_icon.png" alt="" className="size-8 object-contain mb-1 drop-shadow" />
          <h2 className="font-serif-display text-lg font-bold drop-shadow">JSSG Jain Community</h2>
          <p className="text-xs text-white/90">Admin Panel</p>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANE: 45% Width, 100vh Height (Login Card + Watermark)
         ========================================================================= */}
      <main className="relative flex-1 lg:h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#FAF8F5] overflow-y-auto">
        {/* Right side Ahimsa Hand Watermark (Using user's Login_backgorund_Hand.png) */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[240px] sm:w-[320px] xl:w-[400px] hidden md:flex items-center justify-end pr-2 select-none opacity-85">
          <img
            src="/Login_backgorund_Hand.png"
            alt="Ahimsa Hand Watermark"
            className="max-h-[85%] w-auto object-contain select-none"
          />
        </div>

        {/* The Login Card container */}
        <div className="relative z-10 w-full max-w-[370px] sm:max-w-[390px] my-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
