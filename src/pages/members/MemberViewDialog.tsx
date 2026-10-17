import { formatDate, formatDateTime, initials } from "@/lib/format"
import { useLanguage } from "@/lib/language"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pencil } from "lucide-react"
import type { MemberRecord } from "@/types"

interface MemberViewDialogProps {
  member: MemberRecord | null
  onOpenChange: (open: boolean) => void
  onEdit: (member: MemberRecord) => void
}

interface Field {
  label: string
  value: string | null | undefined
  wide?: boolean
  /** Dates, numbers, phone numbers, ids, emails... shown exactly as stored. */
  raw?: boolean
}

interface Section {
  title: string
  fields: Field[]
}

function KV({ label, value, wide = false, raw = false }: Field) {
  const { t, h } = useLanguage()
  const display = value?.toString().trim() ? (raw ? value : h(String(value))) : "—"
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-xs text-muted-foreground">{t(label)}</p>
      <p className="font-medium break-words">{display}</p>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useLanguage()
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t(title)}</h4>
      {children}
    </div>
  )
}

function memberPhoto(member: MemberRecord): string | null {
  return member.profile_photo_url || member.member_photo_link || null
}

/** The English values are only ever converted here, at display time. */
function buildSections(member: MemberRecord): Section[] {
  return [
    {
      title: "Contact",
      fields: [
        { label: "Phone", value: member.phone_number, raw: true },
        { label: "Email", value: member.email, raw: true },
        { label: "Contact phone", value: member.contact_phone, raw: true },
        { label: "Contact email", value: member.contact_email, raw: true },
      ],
    },
    {
      title: "Profile",
      fields: [
        { label: "Gender", value: member.gender },
        { label: "Blood group", value: member.blood_group, raw: true },
        { label: "Date of birth", value: formatDate(member.member_dob ?? ""), raw: true },
        { label: "Education", value: member.member_education },
        { label: "Occupation", value: member.member_occupation },
        { label: "Company", value: member.company_name },
        { label: "Social group", value: member.social_group_name },
        { label: "Designation", value: member.group_designation },
        { label: "Interests", value: member.interest_fields },
        { label: "Occupation summary", value: member.occupation_summary, wide: true },
      ],
    },
    {
      title: "Address",
      fields: [
        { label: "Address", value: member.address, wide: true, raw: true },
        { label: "Address line", value: member.address_line, wide: true, raw: true },
        { label: "Business address", value: member.business_address, wide: true, raw: true },
        { label: "City", value: member.city },
        { label: "Area", value: member.area },
      ],
    },
    {
      title: "Family",
      fields: [
        { label: "Family size", value: member.family_member_count, raw: true },
        { label: "Anniversary", value: formatDate(member.anniversary_date ?? ""), raw: true },
        { label: "Spouse", value: member.spouse_name },
        { label: "Spouse mobile", value: member.spouse_mobile, raw: true },
        { label: "Spouse DOB", value: formatDate(member.spouse_dob ?? ""), raw: true },
        { label: "Spouse education", value: member.spouse_education },
        { label: "Spouse occupation", value: member.spouse_occupation },
        { label: "Unmarried son 1", value: member.unmarried_son1_details },
        { label: "Unmarried son 1 DOB", value: formatDate(member.unmarried_son1_dob ?? ""), raw: true },
        { label: "Unmarried son 1 education", value: member.unmarried_son1_education },
        { label: "Unmarried son 1 occupation", value: member.unmarried_son1_occupation },
        { label: "Unmarried son 2", value: member.unmarried_son2_details },
        { label: "Unmarried son 2 DOB", value: formatDate(member.unmarried_son2_dob ?? ""), raw: true },
        { label: "Unmarried son 2 education", value: member.unmarried_son2_education },
        { label: "Unmarried son 2 occupation", value: member.unmarried_son2_occupation },
        { label: "Unmarried son 3", value: member.unmarried_son3_details },
        { label: "Unmarried son 3 DOB", value: formatDate(member.unmarried_son3_dob ?? ""), raw: true },
        { label: "Unmarried son 3 education", value: member.unmarried_son3_education },
        { label: "Unmarried son 3 occupation", value: member.unmarried_son3_occupation },
        { label: "Unmarried daughter 1", value: member.unmarried_daughter1_details },
        { label: "Unmarried daughter 1 DOB", value: formatDate(member.unmarried_daughter1_dob ?? ""), raw: true },
        { label: "Unmarried daughter 1 education", value: member.unmarried_daughter1_education },
        { label: "Unmarried daughter 1 occupation", value: member.unmarried_daughter1_occupation },
        { label: "Unmarried daughter 2", value: member.unmarried_daughter2_details },
        { label: "Unmarried daughter 2 DOB", value: formatDate(member.unmarried_daughter2_dob ?? ""), raw: true },
        { label: "Unmarried daughter 2 education", value: member.unmarried_daughter2_education },
        { label: "Unmarried daughter 2 occupation", value: member.unmarried_daughter2_occupation },
        { label: "Unmarried daughter 3", value: member.unmarried_daughter3_details },
        { label: "Unmarried daughter 3 DOB", value: formatDate(member.unmarried_daughter3_dob ?? ""), raw: true },
        { label: "Unmarried daughter 3 education", value: member.unmarried_daughter3_education },
        { label: "Unmarried daughter 3 occupation", value: member.unmarried_daughter3_occupation },
      ],
    },
    {
      title: "Linked account",
      fields: [
        { label: "User ID", value: member.user_id, raw: true },
        { label: "Role", value: member.user?.role?.name, raw: true },
        { label: "Account email", value: member.user?.email, raw: true },
        { label: "Phone verified", value: member.user?.is_phone_verified ? "Yes" : "No" },
        { label: "Email verified", value: member.user?.is_email_verified ? "Yes" : "No" },
        { label: "Last login", value: formatDateTime(member.user?.last_login_at ?? ""), raw: true },
      ],
    },
    {
      title: "Record",
      fields: [
        { label: "Member ID", value: member.id, raw: true },
        { label: "Status", value: member.membership_status },
        { label: "Joined", value: formatDateTime(member.joined_at ?? member.created_at), raw: true },
        { label: "Approved", value: formatDateTime(member.approved_at ?? ""), raw: true },
        { label: "Created", value: formatDateTime(member.created_at), raw: true },
        { label: "Updated", value: formatDateTime(member.updated_at), raw: true },
        ...(member.rejection_reason
          ? [{ label: "Rejection reason", value: member.rejection_reason, wide: true }]
          : []),
      ],
    },
  ]
}

export function MemberViewDialog({ member, onOpenChange, onEdit }: MemberViewDialogProps) {
  const { t, h } = useLanguage()
  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-h-[90vh] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-2xl">
        {member && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  {memberPhoto(member) && <AvatarImage src={memberPhoto(member) as string} alt={member.full_name} />}
                  <AvatarFallback>{initials(member.full_name) || "?"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <DialogTitle>{h(member.full_name)}</DialogTitle>
                  <DialogDescription>
                    {member.membership_number || t("No membership number")}
                    {member.membership_status !== "PENDING" && ` · ${h(member.membership_status)}`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 overflow-y-auto pr-1">
              {!member.is_profile_complete && (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  {t("This profile is flagged as incomplete by the API.")}
                </p>
              )}

              {buildSections(member).map((section) => (
                <Group key={section.title} title={section.title}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {section.fields.map((field) => (
                      <KV key={field.label} {...field} />
                    ))}
                  </div>

                  {section.title === "Family" && (member.family_members ?? []).length > 0 && (
                    <ul className="space-y-1 pt-1 text-sm">
                      {(member.family_members ?? []).map((relative, index) => (
                        <li key={relative.id ?? index} className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{t(relative.relationship_type)}</Badge>
                          <span className="font-medium">{h(relative.name)}</span>
                          {relative.date_of_birth && (
                            <span className="text-xs text-muted-foreground">{formatDate(relative.date_of_birth)}</span>
                          )}
                          {relative.contact_phone && (
                            <span className="text-xs text-muted-foreground">{relative.contact_phone}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Group>
              ))}

              {(member.professional_info ?? []).length > 0 && (
                <Group title="Professional records">
                  <ul className="space-y-1 text-sm">
                    {(member.professional_info ?? []).map((info, index) => (
                      <li key={info.id ?? index} className="text-muted-foreground">
                        {[h(info.occupation), h(info.designation), h(info.company_name)].filter(Boolean).join(" · ") || "—"}
                      </li>
                    ))}
                  </ul>
                </Group>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("Close")}
              </Button>
              <Button onClick={() => onEdit(member)}>
                <Pencil />
                {t("Edit member")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
