import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/lib/language";

const DashboardBanner = () => {
  const { t } = useLanguage();
  return (
    <section className="relative min-h-[250px] overflow-hidden rounded-[24px] bg-[#680b0d]">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,215,120,0.35)_1px,transparent_1px)] bg-[length:35px_35px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-[250px] items-center px-8 py-8 md:px-10">
        <div className="max-w-[55%]">
          <h2 className="text-3xl font-bold text-[#f5d77a] md:text-[34px]">
            {t("Jai Jinendra!")}
          </h2>

          <p className="mt-4 text-[16px] leading-8 text-[#f3e6d0] md:text-[18px]">
            {t("A digital initiative, towards")}
            <br />
            {t("uniting our community...")}
          </p>

          <Link
            to="/registrations"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#d5ad4b] px-6 py-3 font-semibold text-[#f5d77a] transition-all duration-300 hover:bg-[#d5ad4b] hover:text-[#680b0d]"
          >
            {t("Learn more")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Temple image */}
        <div className="absolute bottom-0 right-5 flex h-full w-[45%] items-end justify-end">
          <img
            src="/jain_temple.png"
            alt={t("Jain Temple")}
            className="w-[300px] object-contain md:w-[380px]"
          />
        </div>
      </div>
    </section>
  );
};

export default DashboardBanner;