import { useMemo, useState } from "react"
import {
  User,
  Phone,
  Users,
  Heart,
  Home,
  Pencil,
  AlertCircle,
  X,
  Maximize2,
} from "lucide-react"
import { formatDate, initials } from "@/lib/format"
import { useLanguage } from "@/lib/language"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/StatusBadge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { MemberRecord } from "@/types"

interface MemberViewDialogProps {
  member: MemberRecord | null
  onOpenChange: (open: boolean) => void
  onEdit: (member: MemberRecord) => void
}

interface DetailItem {
  label: string
  value: string
  wide?: boolean
  raw?: boolean
}

function hasValue(val: unknown): val is string | number {
  if (val === null || val === undefined) return false
  const s = String(val).trim()
  return s.length > 0 && s !== "—" && s !== "-"
}

function memberPhoto(member: MemberRecord): string | null {
  return member.profile_photo_url || member.member_photo_link || null
}

function groupNames(member: MemberRecord): string {
  const memberships = [...(member.group_memberships ?? [])].sort((a, b) => a.priority - b.priority)
  const names = memberships
    .map((m) => m.group_name)
    .filter((name): name is string => hasValue(name))
  if (names.length > 0) return names.join(", ")
  if (hasValue(member.social_group_name)) return member.social_group_name
  return ""
}

interface ChildEntry {
  type: "Son" | "Daughter"
  title: string
  name?: string
  dob?: string
  education?: string
  occupation?: string
}

function extractChildren(member: MemberRecord): ChildEntry[] {
  const children: ChildEntry[] = []

  const slots = [
    { type: "Son" as const, num: 1, name: member.unmarried_son1_details, dob: member.unmarried_son1_dob, edu: member.unmarried_son1_education, occ: member.unmarried_son1_occupation },
    { type: "Son" as const, num: 2, name: member.unmarried_son2_details, dob: member.unmarried_son2_dob, edu: member.unmarried_son2_education, occ: member.unmarried_son2_occupation },
    { type: "Son" as const, num: 3, name: member.unmarried_son3_details, dob: member.unmarried_son3_dob, edu: member.unmarried_son3_education, occ: member.unmarried_son3_occupation },
    { type: "Daughter" as const, num: 1, name: member.unmarried_daughter1_details, dob: member.unmarried_daughter1_dob, edu: member.unmarried_daughter1_education, occ: member.unmarried_daughter1_occupation },
    { type: "Daughter" as const, num: 2, name: member.unmarried_daughter2_details, dob: member.unmarried_daughter2_dob, edu: member.unmarried_daughter2_education, occ: member.unmarried_daughter2_occupation },
    { type: "Daughter" as const, num: 3, name: member.unmarried_daughter3_details, dob: member.unmarried_daughter3_dob, edu: member.unmarried_daughter3_education, occ: member.unmarried_daughter3_occupation },
  ]

  for (const slot of slots) {
    if (hasValue(slot.name) || hasValue(slot.dob) || hasValue(slot.edu) || hasValue(slot.occ)) {
      children.push({
        type: slot.type,
        title: `${slot.type} ${slot.num}`,
        name: hasValue(slot.name) ? String(slot.name).trim() : undefined,
        dob: hasValue(slot.dob) ? formatDate(String(slot.dob)) : undefined,
        education: hasValue(slot.edu) ? String(slot.edu).trim() : undefined,
        occupation: hasValue(slot.occ) ? String(slot.occ).trim() : undefined,
      })
    }
  }

  return children
}

export function MemberViewDialog({ member, onOpenChange, onEdit }: MemberViewDialogProps) {
  const { t, h } = useLanguage()

  // Full-size image preview state
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null)

  // Build the organized sections, keeping only non-empty fields and omitting membership number / group designation
  const sections = useMemo(() => {
    if (!member) return null

    // 1. Member Details
    const memberDetails: DetailItem[] = []
    if (hasValue(member.gender)) memberDetails.push({ label: "Gender", value: member.gender })
    const dob = member.member_dob || member.date_of_birth
    if (hasValue(dob)) memberDetails.push({ label: "Date of Birth", value: formatDate(dob), raw: true })
    if (hasValue(member.blood_group)) memberDetails.push({ label: "Blood Group", value: member.blood_group })
    if (hasValue(member.member_education)) memberDetails.push({ label: "Education", value: member.member_education })
    if (hasValue(member.member_occupation)) memberDetails.push({ label: "Occupation", value: member.member_occupation })
    if (hasValue(member.company_name)) memberDetails.push({ label: "Company", value: member.company_name })
    if (hasValue(member.business_designation)) memberDetails.push({ label: "Business Designation", value: member.business_designation })
    if (hasValue(member.city)) memberDetails.push({ label: "City", value: member.city })
    if (hasValue(member.area)) memberDetails.push({ label: "Area", value: member.area })
    const address = member.address || member.address_line
    if (hasValue(address)) memberDetails.push({ label: "Residential Address", value: address, wide: true, raw: true })
    if (hasValue(member.business_address)) memberDetails.push({ label: "Business Address", value: member.business_address, wide: true, raw: true })
    if (hasValue(member.interest_fields)) memberDetails.push({ label: "Interests & Social Activities", value: member.interest_fields, wide: true })
    if (hasValue(member.occupation_summary)) memberDetails.push({ label: "Occupation Summary", value: member.occupation_summary, wide: true })

    // 2. Contact Information
    const contactInfo: DetailItem[] = []
    if (hasValue(member.phone_number)) contactInfo.push({ label: "Primary Phone", value: member.phone_number, raw: true })
    if (hasValue(member.email)) contactInfo.push({ label: "Primary Email", value: member.email, raw: true })
    if (hasValue(member.contact_phone) && member.contact_phone !== member.phone_number) {
      contactInfo.push({ label: "Alternate Phone", value: member.contact_phone, raw: true })
    }
    if (hasValue(member.contact_email) && member.contact_email !== member.email) {
      contactInfo.push({ label: "Alternate Email", value: member.contact_email, raw: true })
    }

    // 3. Group Information (Social Groups only; membership_number and group_designation removed)
    const groupInfo: DetailItem[] = []
    const groups = groupNames(member)
    if (hasValue(groups)) groupInfo.push({ label: "Social Groups", value: groups, wide: true })

    // 4. Spouse Details
    const spouseDetails: DetailItem[] = []
    if (hasValue(member.spouse_name)) spouseDetails.push({ label: "Spouse Name", value: member.spouse_name })
    if (hasValue(member.spouse_mobile)) spouseDetails.push({ label: "Spouse Mobile", value: member.spouse_mobile, raw: true })
    if (hasValue(member.spouse_dob)) spouseDetails.push({ label: "Spouse Date of Birth", value: formatDate(member.spouse_dob), raw: true })
    if (hasValue(member.spouse_education)) spouseDetails.push({ label: "Spouse Education", value: member.spouse_education })
    if (hasValue(member.spouse_occupation)) spouseDetails.push({ label: "Spouse Occupation", value: member.spouse_occupation })

    // 5. Family Details (Anniversary, Family Size, Children)
    const familyDetails: DetailItem[] = []
    if (hasValue(member.anniversary_date)) familyDetails.push({ label: "Anniversary Date", value: formatDate(member.anniversary_date), raw: true })
    if (hasValue(member.family_member_count)) familyDetails.push({ label: "Family Size", value: String(member.family_member_count), raw: true })

    const children = extractChildren(member)

    return {
      memberDetails,
      contactInfo,
      groupInfo,
      spouseDetails,
      familyDetails,
      children,
    }
  }, [member])

  if (!member || !sections) return null

  const photoUrl = memberPhoto(member)

  return (
    <>
      <Dialog open={!!member} onOpenChange={(open) => !open && onOpenChange(false)}>
        <DialogContent className="max-h-[92vh] sm:max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] p-0 overflow-hidden border border-border/80 shadow-2xl bg-card">
          {/* HEADER SECTION */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-b from-[#c5a84e]/10 to-transparent border-b border-border/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Clickable Member Avatar */}
                <button
                  type="button"
                  disabled={!photoUrl}
                  onClick={() =>
                    photoUrl &&
                    setPreviewImage({
                      src: photoUrl,
                      title: `${member.full_name} (Member Photo)`,
                    })
                  }
                  className={cn(
                    "relative rounded-full focus:outline-none focus:ring-2 focus:ring-[#c5a84e]",
                    photoUrl && "group cursor-pointer hover:ring-2 hover:ring-[#c5a84e] transition-all"
                  )}
                  title={photoUrl ? "Click to view full image" : undefined}
                >
                  <Avatar className="size-16 ring-2 ring-[#c5a84e]/60 shadow-md">
                    {photoUrl && <AvatarImage src={photoUrl} alt={member.full_name} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-primary font-serif text-lg font-bold">
                      {initials(member.full_name) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {photoUrl && (
                    <div className="absolute inset-0 rounded-full bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
                      <Maximize2 className="size-4" />
                    </div>
                  )}
                </button>

                <div className="space-y-1">
                  <DialogTitle className="text-xl sm:text-2xl font-serif tracking-tight text-foreground">
                    {h(member.full_name)}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <StatusBadge status={member.membership_status} />
                    {member.city && <span>· {member.city}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Warning / Rejection Alert if present */}
            {!member.is_profile_complete && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="size-3.5 shrink-0" />
                <span>{t("Profile flagged as incomplete by the API.")}</span>
              </div>
            )}
            {member.rejection_reason && (
              <div className="mt-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive">
                <span className="font-medium">Rejection Reason:</span> {member.rejection_reason}
              </div>
            )}
          </DialogHeader>

          {/* BODY SCROLL CONTENT */}
          <div className="space-y-4 overflow-y-auto px-6 py-5 pr-5">
            {/* 1. MEMBER DETAILS */}
            {sections.memberDetails.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs transition-all hover:border-[#c5a84e]/30">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-[#123f24] dark:text-[#c5a84e] font-semibold text-xs tracking-wider uppercase">
                  <User className="size-4 text-[#c5a84e]" />
                  <span>{t("Member Details")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {sections.memberDetails.map((item) => (
                    <div key={item.label} className={item.wide ? "sm:col-span-2" : ""}>
                      <p className="text-xs font-medium text-muted-foreground">{t(item.label)}</p>
                      <p className="font-medium text-foreground break-words mt-0.5">
                        {item.raw ? item.value : h(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. CONTACT INFORMATION */}
            {sections.contactInfo.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs transition-all hover:border-[#c5a84e]/30">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-[#123f24] dark:text-[#c5a84e] font-semibold text-xs tracking-wider uppercase">
                  <Phone className="size-4 text-[#c5a84e]" />
                  <span>{t("Contact Information")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {sections.contactInfo.map((item) => (
                    <div key={item.label} className={item.wide ? "sm:col-span-2" : ""}>
                      <p className="text-xs font-medium text-muted-foreground">{t(item.label)}</p>
                      <p className="font-medium text-foreground break-words mt-0.5 font-mono text-xs sm:text-sm">
                        {item.raw ? item.value : h(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. GROUP INFORMATION */}
            {sections.groupInfo.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs transition-all hover:border-[#c5a84e]/30">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-[#123f24] dark:text-[#c5a84e] font-semibold text-xs tracking-wider uppercase">
                  <Users className="size-4 text-[#c5a84e]" />
                  <span>{t("Group Information")}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {sections.groupInfo.map((item) => (
                    <div key={item.label} className={item.wide ? "sm:col-span-2" : ""}>
                      <p className="text-xs font-medium text-muted-foreground">{t(item.label)}</p>
                      <p className="font-medium text-foreground break-words mt-0.5">
                        {item.raw ? item.value : h(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. SPOUSE DETAILS (with enlarged image on the right) */}
            {sections.spouseDetails.length > 0 && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs transition-all hover:border-[#c5a84e]/30">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-[#123f24] dark:text-[#c5a84e] font-semibold text-xs tracking-wider uppercase">
                  <Heart className="size-4 text-[#c5a84e]" />
                  <span>{t("Spouse Details")}</span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-5">
                  {/* Left Side: Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm flex-1 w-full">
                    {sections.spouseDetails.map((item) => (
                      <div key={item.label} className={item.wide ? "sm:col-span-2" : ""}>
                        <p className="text-xs font-medium text-muted-foreground">{t(item.label)}</p>
                        <p className="font-medium text-foreground break-words mt-0.5">
                          {item.raw ? item.value : h(item.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Right Side: Enlarged Clickable Spouse Photo */}
                  {member.spouse_photo_link && (
                    <div className="shrink-0 self-center sm:self-start">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            src: member.spouse_photo_link as string,
                            title: member.spouse_name ? `${member.spouse_name} (Spouse)` : "Spouse Photo",
                          })
                        }
                        className="group relative block rounded-2xl p-1 bg-gradient-to-tr from-[#c5a84e]/40 via-transparent to-[#c5a84e]/40 hover:from-[#c5a84e]/80 transition-all cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-[#c5a84e]"
                        title="Click to view full image"
                      >
                        <div className="relative size-24 sm:size-28 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={member.spouse_photo_link}
                            alt={member.spouse_name ?? "Spouse"}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium gap-1">
                            <Maximize2 className="size-3.5" />
                            <span>View</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. FAMILY DETAILS */}
            {(sections.familyDetails.length > 0 || sections.children.length > 0) && (
              <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs transition-all hover:border-[#c5a84e]/30">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50 text-[#123f24] dark:text-[#c5a84e] font-semibold text-xs tracking-wider uppercase">
                  <Home className="size-4 text-[#c5a84e]" />
                  <span>{t("Family Details")}</span>
                </div>

                {/* General Family Info */}
                {sections.familyDetails.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-3">
                    {sections.familyDetails.map((item) => (
                      <div key={item.label} className={item.wide ? "sm:col-span-2" : ""}>
                        <p className="text-xs font-medium text-muted-foreground">{t(item.label)}</p>
                        <p className="font-medium text-foreground break-words mt-0.5">
                          {item.raw ? item.value : h(item.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Children Cards */}
                {sections.children.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("Children")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {sections.children.map((child, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-background/60 border border-border/60 text-xs space-y-1 hover:border-[#c5a84e]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {child.name || `${child.title}`}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-[#c5a84e]/40 text-[#123f24] dark:text-[#c5a84e]">
                              {child.type}
                            </Badge>
                          </div>
                          {child.dob && (
                            <p className="text-muted-foreground">
                              <span className="font-medium">DOB:</span> {child.dob}
                            </p>
                          )}
                          {(child.education || child.occupation) && (
                            <p className="text-muted-foreground truncate">
                              {[child.education, child.occupation].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DIALOG FOOTER */}
          <DialogFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t("Close")}
            </Button>
            <Button
              size="sm"
              onClick={() => onEdit(member)}
              className="bg-[#123f24] text-white hover:bg-[#123f24]/90 dark:bg-[#c5a84e] dark:text-[#123f24] gap-1.5"
            >
              <Pencil className="size-3.5" />
              {t("Edit member")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULL SIZE IMAGE LIGHTBOX MODAL */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-black/95 border-zinc-800 shadow-2xl">
          <div className="relative flex flex-col items-center justify-center p-3">
            <div className="w-full flex items-center justify-between pb-2 px-2 text-zinc-300 border-b border-zinc-800">
              <span className="text-sm font-medium truncate">{previewImage?.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => setPreviewImage(null)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                aria-label="Close image preview"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="max-h-[75vh] w-full flex items-center justify-center p-2 overflow-hidden">
              {previewImage && (
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
