import type { MemberCreateInput, MemberPatchInput, MemberRecord } from "@/types"

export type MemberOptionSource = "groups" | "locations"

export type MemberFieldKey =
  | "full_name"
  | "gender"
  | "member_dob"
  | "phone_number"
  | "email"
  | "profile_photo_url"
  | "member_photo_link"
  | "family_member_count"
  | "spouse_name"
  | "spouse_mobile"
  | "spouse_dob"
  | "spouse_photo_link"
  | "spouse_education"
  | "spouse_occupation"
  | "anniversary_date"
  | "unmarried_son1_details"
  | "unmarried_son1_dob"
  | "unmarried_son1_education"
  | "unmarried_son1_occupation"
  | "unmarried_son2_details"
  | "unmarried_son2_dob"
  | "unmarried_son2_education"
  | "unmarried_son2_occupation"
  | "unmarried_son3_details"
  | "unmarried_son3_dob"
  | "unmarried_son3_education"
  | "unmarried_son3_occupation"
  | "unmarried_daughter1_details"
  | "unmarried_daughter1_dob"
  | "unmarried_daughter1_education"
  | "unmarried_daughter1_occupation"
  | "unmarried_daughter2_details"
  | "unmarried_daughter2_dob"
  | "unmarried_daughter2_education"
  | "unmarried_daughter2_occupation"
  | "unmarried_daughter3_details"
  | "unmarried_daughter3_dob"
  | "unmarried_daughter3_education"
  | "unmarried_daughter3_occupation"
  | "member_education"
  | "member_occupation"
  | "company_name"
  | "occupation_summary"
  | "group_designation"
  | "social_group_name"
  | "interest_fields"
  | "business_address"
  | "address"
  | "city"
  | "area"
  | "address_line"
  | "group_id"

export type FieldType = "text" | "email" | "tel" | "url" | "date" | "number" | "textarea" | "select"

export interface FieldSpec<K extends string = MemberFieldKey> {
  key: K
  label: string
  type: FieldType
  required?: boolean
  full?: boolean
  placeholder?: string
  hint?: string
  options?: { label: string; value: string }[]
  optionsSource?: MemberOptionSource
}

export interface FieldSection<K extends string = MemberFieldKey> {
  id: string
  label: string
  fields: FieldSpec<K>[]
}

const GENDERS = ["Male", "Female", "Other"].map((value) => ({ label: value, value }))


export const CREATE_SECTIONS: FieldSection[] = [
  {
    id: "identity",
    label: "Identity",
    fields: [
      { key: "full_name", label: "Full name", type: "text", required: true, full: true, placeholder: "e.g. Rahul Mehta" },
      { key: "gender", label: "Gender", type: "select", options: GENDERS },
      { key: "member_dob", label: "Date of birth", type: "date" },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    fields: [
      { key: "phone_number", label: "Phone number", type: "tel", required: true, placeholder: "+919876543210" },
      { key: "email", label: "Email", type: "email", placeholder: "member@example.com" },
    ],
  },
  {
    id: "family",
    label: "Family",
    fields: [
      { key: "family_member_count", label: "Family member count", type: "number", placeholder: "0" },
      { key: "anniversary_date", label: "Anniversary date", type: "date" },
      { key: "spouse_name", label: "Spouse name", type: "text" },
      { key: "spouse_mobile", label: "Spouse mobile", type: "tel" },
      { key: "spouse_dob", label: "Spouse DOB", type: "date" },
      { key: "spouse_education", label: "Spouse education", type: "text" },
      { key: "spouse_occupation", label: "Spouse occupation", type: "text" },
      { key: "unmarried_son1_details", label: "Unmarried son 1 details", type: "text" },
      { key: "unmarried_son1_dob", label: "Unmarried son 1 DOB", type: "date" },
      { key: "unmarried_son1_education", label: "Unmarried son 1 education", type: "text" },
      { key: "unmarried_son1_occupation", label: "Unmarried son 1 occupation", type: "text" },
      { key: "unmarried_son2_details", label: "Unmarried son 2 details", type: "text" },
      { key: "unmarried_son2_dob", label: "Unmarried son 2 DOB", type: "date" },
      { key: "unmarried_son2_education", label: "Unmarried son 2 education", type: "text" },
      { key: "unmarried_son2_occupation", label: "Unmarried son 2 occupation", type: "text" },
      { key: "unmarried_son3_details", label: "Unmarried son 3 details", type: "text" },
      { key: "unmarried_son3_dob", label: "Unmarried son 3 DOB", type: "date" },
      { key: "unmarried_son3_education", label: "Unmarried son 3 education", type: "text" },
      { key: "unmarried_son3_occupation", label: "Unmarried son 3 occupation", type: "text" },
      { key: "unmarried_daughter1_details", label: "Unmarried daughter 1 details", type: "text" },
      { key: "unmarried_daughter1_dob", label: "Unmarried daughter 1 DOB", type: "date" },
      { key: "unmarried_daughter1_education", label: "Unmarried daughter 1 education", type: "text" },
      { key: "unmarried_daughter1_occupation", label: "Unmarried daughter 1 occupation", type: "text" },
      { key: "unmarried_daughter2_details", label: "Unmarried daughter 2 details", type: "text" },
      { key: "unmarried_daughter2_dob", label: "Unmarried daughter 2 DOB", type: "date" },
      { key: "unmarried_daughter2_education", label: "Unmarried daughter 2 education", type: "text" },
      { key: "unmarried_daughter2_occupation", label: "Unmarried daughter 2 occupation", type: "text" },
      { key: "unmarried_daughter3_details", label: "Unmarried daughter 3 details", type: "text" },
      { key: "unmarried_daughter3_dob", label: "Unmarried daughter 3 DOB", type: "date" },
      { key: "unmarried_daughter3_education", label: "Unmarried daughter 3 education", type: "text" },
      { key: "unmarried_daughter3_occupation", label: "Unmarried daughter 3 occupation", type: "text" },
    ],
  },
  {
    id: "professional",
    label: "Professional & social",
    fields: [
      { key: "member_education", label: "Member education", type: "text" },
      { key: "member_occupation", label: "Member occupation", type: "text" },
      { key: "company_name", label: "Company name", type: "text" },
      { key: "group_designation", label: "Group designation", type: "text" },
      { key: "social_group_name", label: "Social group name", type: "text" },
      { key: "occupation_summary", label: "Occupation summary", type: "textarea", full: true },
      { key: "interest_fields", label: "Interest fields", type: "textarea", full: true, placeholder: "Comma separated" },
    ],
  },
  {
    id: "address",
    label: "Address & assignment",
    fields: [
      { key: "address", label: "Address", type: "textarea", full: true },
      { key: "address_line", label: "Address line", type: "textarea", full: true },
      { key: "business_address", label: "Business address", type: "textarea", full: true },
      { key: "city", label: "City", type: "text" },
      { key: "area", label: "Area", type: "text" },
      { key: "group_id", label: "Social group", type: "select", optionsSource: "groups" },
    ],
  },
]

/**
 * Fields kept in the form state and payloads but never rendered: the photo URLs
 * are managed by the photo uploader, not typed by hand.
 */
const HIDDEN_SECTIONS: FieldSection[] = [
  {
    id: "media",
    label: "Media",
    fields: [
      { key: "profile_photo_url", label: "Profile photo URL", type: "url" },
      { key: "member_photo_link", label: "Member photo link", type: "url" },
      { key: "spouse_photo_link", label: "Spouse photo link", type: "url" },
    ],
  },
]

/** Every field the form carries: the rendered sections plus the hidden media fields. */
const TRACKED_SECTIONS: FieldSection[] = [...CREATE_SECTIONS, ...HIDDEN_SECTIONS]

export type MemberFormState = Record<MemberFieldKey, string>

export interface MemberOption {
  label: string
  value: string
}

export function emptyMemberForm(): MemberFormState {
  const state = {} as MemberFormState
  for (const section of TRACKED_SECTIONS) {
    for (const field of section.fields) state[field.key] = ""
  }
  return state
}

export function memberToFormState(member: MemberRecord): MemberFormState {
  const state = emptyMemberForm()
  for (const section of TRACKED_SECTIONS) {
    for (const field of section.fields) {
      const value = member[field.key]
      state[field.key] = value === null || value === undefined ? "" : String(value)
    }
  }
  return state
}

/** Resolves the dynamic group/location selects and keeps unlisted stored values selectable. */
export function resolveSections<K extends string>(
  sections: FieldSection<K>[],
  options: Record<MemberOptionSource, MemberOption[]>,
  values: MemberFormState
): FieldSection<string>[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.label,
    fields: section.fields.map((field) => {
      const base = field.optionsSource ? options[field.optionsSource] : field.options
      const current = values[field.key as MemberFieldKey]
      const resolved = current && !base?.some((o) => o.value === current) ? [...(base ?? []), { label: current, value: current }] : base
      return { ...field, options: resolved }
    }),
  }))
}

function toNullable(state: MemberFormState, key: MemberFieldKey): string | null {
  const value = state[key]?.trim()
  return value ? value : null
}

export function toCreateInput(state: MemberFormState, userId: string | null): MemberCreateInput {
  const input: MemberCreateInput = {
    full_name: state.full_name.trim(),
    phone_number: state.phone_number.trim(),
    // A community member does not need a login account. Linking one stays optional,
    // so an imported/Google Sheet member can be created without provisioning a User.
    user_id: userId,
  }
  const target = input as unknown as Record<string, string | null>
  for (const section of TRACKED_SECTIONS) {
    for (const field of section.fields) {
      if (field.key === "full_name" || field.key === "phone_number") continue
      target[field.key] = toNullable(state, field.key)
    }
  }
  return input
}

/** Every field the create form shows, sent as one PATCH: the API applies the
 * keys it receives and leaves the rest alone, so an edit round-trips the whole
 * profile the dialog rendered. */
export function toPatchInput(state: MemberFormState): MemberPatchInput {
  const input: MemberPatchInput = {}
  const target = input as Record<string, string | null>
  for (const section of TRACKED_SECTIONS) {
    for (const field of section.fields) {
      target[field.key] = toNullable(state, field.key)
    }
  }
  return input
}
