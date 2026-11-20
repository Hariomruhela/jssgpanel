import { useLanguage } from "@/lib/language"

export function DashboardBanner() {
  const { t } = useLanguage()

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#E8DFD1] shadow-xs bg-[#FAF6EE] min-h-[160px] md:min-h-[175px]">
      {/* Background Graphic featuring Marble Temple Arches and Tirthankara Statue */}
      <div
        className="absolute inset-0 size-full bg-cover bg-right md:bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/top_dashbord_img.png')" }}
      />

      {/* Soft warm gradient on the left to ensure high readability on all screen resolutions */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6EE]/95 via-[#FAF6EE]/80 to-transparent md:w-[65%]" />

      {/* Banner Content (matches screenshot) */}
      <div className="relative z-10 flex h-full min-h-[130px] md:min-h-[145px] items-center px-6 py-5 sm:px-8">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Gold Ahimsa Hand Icon */}
          <div className="flex shrink-0 items-center justify-center">
            <img
              src="/hand_icon.png"
              alt="Ahimsa Hand"
              className="h-12 w-auto object-contain sm:h-14 drop-shadow-xs select-none"
            />
          </div>

          {/* Vertical Divider */}
          <div className="h-10 w-px bg-[#C5A059]/40 hidden sm:block" />

          {/* Text Details */}
          <div>
            <h1 className="font-serif-display text-xl font-bold tracking-tight text-[#2B1E16] sm:text-2xl">
              {t("JSSG Jain Community")}
            </h1>
            <p className="text-xs font-semibold text-[#7C654E] sm:text-sm">
              {t("Admin Panel")}
            </p>
            <p className="mt-1 text-xs text-[#5C4535] font-medium sm:text-[13px]">
              {t("Together in Faith • United in Service")}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DashboardBanner
