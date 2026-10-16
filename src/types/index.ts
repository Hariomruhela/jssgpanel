export type MemberStatus = "active" | "inactive"
export type RegistrationStatus = "pending" | "approved" | "rejected"
export type GenericStatus = "active" | "inactive" | "draft" | "archived"
export type PaymentStatus = "paid" | "partial" | "overdue" | "unpaid"
export type TransactionStatus = "success" | "pending" | "failed" | "refunded"
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled"
export type PublishStatus = "draft" | "published" | "scheduled"
export type AdStatus = "pending" | "approved" | "active" | "expired" | "rejected"
export type NotificationType = "info" | "success" | "warning" | "emergency"
export type NotificationStatus = "sent" | "scheduled" | "draft"

export interface Member {
  id: string
  regNo: string
  name: string
  email: string
  phone: string
  dob: string
  gender: "Male" | "Female" | "Other"
  occupation: string
  groupId: string
  city: string
  state: string
  address: string
  familySize: number
  joinedOn: string
  status: MemberStatus
}

export type MembershipStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED" | "INACTIVE"

export interface ApiPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  pagination?: ApiPagination
}

export interface UserRole {
  id: string
  name: string
  description: string | null
}

export interface UserAccount {
  id: string
  email: string | null
  phone_number: string | null
  full_name: string
  is_active: boolean
  is_email_verified: boolean
  is_phone_verified: boolean
  last_login_at: string | null
  role: UserRole | null
  created_at: string
  updated_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

/**
 * `POST /auth/login` and `GET /auth/me` are the only two endpoints that answer without the
 * `{ success, message, data }` envelope — the token sits at `tokens.access_token` and the
 * user at `user`.
 */
export interface AuthLoginResponse {
  user: UserAccount
  tokens: AuthTokens
}

export interface UserCreateInput {
  email: string
  password: string
  full_name: string
  phone_number?: string | null
  role_name?: string | null
  is_active?: boolean
}

export interface MemberFamilyMember {
  id?: string
  name: string
  relationship_type: string
  date_of_birth?: string | null
  occupation?: string | null
  contact_phone?: string | null
  is_visible?: boolean
}

export interface MemberProfessionalInfo {
  id?: string
  occupation?: string | null
  company_name?: string | null
  designation?: string | null
  industry?: string | null
  business_phone?: string | null
  business_email?: string | null
  business_address?: string | null
  website?: string | null
  is_visible_in_directory?: boolean
}

export interface MemberRecord {
  full_name: string
  member_dob: string | null
  member_photo_link: string | null
  spouse_name: string | null
  spouse_mobile: string | null
  spouse_dob: string | null
  spouse_photo_link: string | null
  spouse_education: string | null
  spouse_occupation: string | null
  anniversary_date: string | null
  family_member_count: string | null
  son_name: string | null
  son_dob: string | null
  son_education: string | null
  son_occupation: string | null
  daughter_name: string | null
  daughter_dob: string | null
  daughter_education: string | null
  daughter_occupation: string | null
  unmarried_son1_details: string | null
  unmarried_son1_dob: string | null
  unmarried_son1_education: string | null
  unmarried_son1_occupation: string | null
  unmarried_son2_details: string | null
  unmarried_son2_dob: string | null
  unmarried_son2_education: string | null
  unmarried_son2_occupation: string | null
  unmarried_son3_details: string | null
  unmarried_son3_dob: string | null
  unmarried_son3_education: string | null
  unmarried_son3_occupation: string | null
  unmarried_daughter1_details: string | null
  unmarried_daughter1_dob: string | null
  unmarried_daughter1_education: string | null
  unmarried_daughter1_occupation: string | null
  unmarried_daughter2_details: string | null
  unmarried_daughter2_dob: string | null
  unmarried_daughter2_education: string | null
  unmarried_daughter2_occupation: string | null
  unmarried_daughter3_details: string | null
  unmarried_daughter3_dob: string | null
  unmarried_daughter3_education: string | null
  unmarried_daughter3_occupation: string | null
  member_education: string | null
  member_occupation: string | null
  company_name: string | null
  group_designation: string | null
  social_group_name: string | null
  interest_fields: string | null
  business_address: string | null
  address: string | null
  city: string | null
  area: string | null
  phone_number: string
  email: string | null
  id: string
  /** null when the member has no linked login account (e.g. imported members). */
  user_id: string | null
  group_id: string | null
  location_id: string | null
  first_name: string | null
  middle_name: string | null
  last_name: string | null
  gender: string | null
  date_of_birth: string | null
  blood_group: string | null
  profile_photo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address_line: string | null
  occupation_summary: string | null
  membership_number: string | null
  membership_status: MembershipStatus
  joined_at: string | null
  approved_at: string | null
  rejection_reason: string | null
  is_profile_complete: boolean
  /** null for a community member with no linked login account. */
  user: UserAccount | null
  family_members: MemberFamilyMember[]
  professional_info: MemberProfessionalInfo[]
  created_at: string
  updated_at: string
}

export interface MemberCreateInput {
  full_name: string
  phone_number: string
  /** Optional: a community member record does not require a login account. */
  user_id?: string | null
  member_dob?: string | null
  member_photo_link?: string | null
  spouse_name?: string | null
  spouse_mobile?: string | null
  spouse_dob?: string | null
  spouse_photo_link?: string | null
  spouse_education?: string | null
  spouse_occupation?: string | null
  anniversary_date?: string | null
  family_member_count?: string | null
  son_name?: string | null
  son_dob?: string | null
  son_education?: string | null
  son_occupation?: string | null
  daughter_name?: string | null
  daughter_dob?: string | null
  daughter_education?: string | null
  daughter_occupation?: string | null
  unmarried_son1_details?: string | null
  unmarried_son1_dob?: string | null
  unmarried_son1_education?: string | null
  unmarried_son1_occupation?: string | null
  unmarried_son2_details?: string | null
  unmarried_son2_dob?: string | null
  unmarried_son2_education?: string | null
  unmarried_son2_occupation?: string | null
  unmarried_son3_details?: string | null
  unmarried_son3_dob?: string | null
  unmarried_son3_education?: string | null
  unmarried_son3_occupation?: string | null
  unmarried_daughter1_details?: string | null
  unmarried_daughter1_dob?: string | null
  unmarried_daughter1_education?: string | null
  unmarried_daughter1_occupation?: string | null
  unmarried_daughter2_details?: string | null
  unmarried_daughter2_dob?: string | null
  unmarried_daughter2_education?: string | null
  unmarried_daughter2_occupation?: string | null
  unmarried_daughter3_details?: string | null
  unmarried_daughter3_dob?: string | null
  unmarried_daughter3_education?: string | null
  unmarried_daughter3_occupation?: string | null
  member_education?: string | null
  member_occupation?: string | null
  company_name?: string | null
  group_designation?: string | null
  social_group_name?: string | null
  interest_fields?: string | null
  business_address?: string | null
  address?: string | null
  city?: string | null
  area?: string | null
  email?: string | null
  group_id?: string | null
  location_id?: string | null
  first_name?: string | null
  middle_name?: string | null
  last_name?: string | null
  gender?: string | null
  date_of_birth?: string | null
  blood_group?: string | null
  profile_photo_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address_line?: string | null
  occupation_summary?: string | null
  membership_number?: string | null
}

/**
 * `PATCH /members/{id}` accepts every create field except `user_id`: profile
 * columns (`full_name`, `phone_number`, `member_*`, `spouse_*`, ...) plus the
 * members columns, each optional and each left alone when absent.
 */
export type MemberPatchInput = Partial<Omit<MemberCreateInput, "user_id">>

/**
 * `GET /members/{id}`, `PATCH /members/{id}` and `POST /members/{id}/approve` answer
 * with the full list-item shape (`MemberListItemOut`): members columns plus every
 * profile column, so a detail response can be merged straight over a list row.
 */
export type MemberDetail = Pick<MemberRecord, "id"> & Partial<MemberRecord>

export interface Registration {
  id: string
  regNo: string
  name: string
  email: string
  phone: string
  gender: "Male" | "Female" | "Other"
  dob: string
  groupId: string
  city: string
  proposal: string
  appliedOn: string
  status: RegistrationStatus
  reviewedBy?: string
  reviewedOn?: string
  notes?: string
}

export interface Trustee {
  id: string
  name: string
  designation:
    | "President"
    | "Vice President"
    | "Secretary"
    | "Joint Secretary"
    | "Treasurer"
    | "Trustee Member"
  groupId: string
  city: string
  phone: string
  email: string
  tenureFrom: string
  tenureTo: string
  status: "active" | "inactive"
}

export interface SocialGroup {
  id: string
  code: string
  name: string
  city: string
  state: string
  chairperson: string
  contact: string
  email: string
  memberCount: number
  category: string
  foundedYear: number
  status: "active" | "inactive"
}

export interface GroupAdmin {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  is_active: boolean
}

/** A `social_groups` row exactly as `GET /api/v1/groups` returns it. */
export interface GroupRecord {
  id: string
  name: string
  name_hi: string | null
  description: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  logo_url: string | null
  status: string
  is_active: boolean
  location_id: string | null
  admins: GroupAdmin[]
  created_at: string
  updated_at: string
}

/** Payload for `POST /api/v1/groups` and `PATCH /api/v1/groups/{id}`. */
export interface GroupInput {
  name: string
  name_hi?: string | null
  description?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  logo_url?: string | null
  status?: string
  is_active?: boolean
  location_id?: string | null
}

/** An item of `GET /api/v1/groups/{id}/members`. */
export interface GroupMember {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  membership_number: string | null
  membership_status: string
  contact_email: string | null
  contact_phone: string | null
  profile_photo_url: string | null
  /** Linked login account; null for imported members with no user. */
  user_id?: string | null
}

export interface City {
  id: string
  name: string
  state: string
  region: string
  groupCount: number
  memberCount: number
  status: "active" | "inactive"
}

export interface CommunityInfo {
  id: string
  title: string
  category: string
  content: string
  featured: boolean
  updatedBy: string
  updatedOn: string
  status: "published" | "draft"
}

export interface CommunityEvent {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  city: string
  organizerId: string
  attendeeCount: number
  capacity: number
  status: EventStatus
  description: string
}

export interface Announcement {
  id: string
  title: string
  category: string
  summary: string
  author: string
  publishedOn: string
  publishStatus: PublishStatus
  pinned: boolean
}

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  audience: string
  groups: string[]
  sentBy: string
  sentOn: string
  status: NotificationStatus
  delivered: number
  opened: number
}

export interface Advertisement {
  id: string
  title: string
  advertiser: string
  type: "Banner" | "Sidebar" | "Popup" | "Sponsored Post"
  placement: string
  mediaLabel: string
  startDate: string
  endDate: string
  status: AdStatus
  impressions: number
  clicks: number
  spend: number
  submittedBy: string
  submittedOn: string
  approvedBy?: string
}

export type PermissionKey =
  | "members.view"
  | "members.manage"
  | "registrations.approve"
  | "trustees.manage"
  | "groups.manage"
  | "locations.manage"
  | "community.manage"
  | "events.manage"
  | "news.manage"
  | "notifications.send"
  | "ads.approve"
  | "roles.manage"
  | "reports.view"
  | "fees.manage"
  | "payments.view"
  | "payments.refund"

export interface Role {
  id: string
  name: string
  description: string
  type: "System" | "Custom"
  users: number
  permissions: Record<PermissionKey, boolean>
}

export interface AdminUser {
  id: string
  name: string
  email: string
  roleId: string
  status: "active" | "inactive"
  lastLogin: string
  memberSince: string
}

export interface FeeConfig {
  groupId: string
  fiscalYear: string
  amount: number
  dueDate: string
  lateFee: number
  cycle: string
  status: "open" | "closed"
  collected: number
  collectionRate: number
  totalMembers: number
  paidMembers: number
}

export interface PaymentTransaction {
  id: string
  txnNo: string
  receiptNo: string
  payerName: string
  groupId: string
  fiscalYear: string
  amount: number
  method: "UPI" | "Bank Transfer" | "Cheque" | "Cash" | "Card"
  status: TransactionStatus
  paidOn: string
  remark: string
}

export interface DashboardStats {
  totalMembers: number
  activeGroups: number
  pendingRegistrations: number
  totalLocations: number
  collectedThisYear: number
  outstandingFees: number
  upcomingEvents: number
  activeAds: number
  newMembersThisMonth: number
}

export interface MemberGrowthPoint {
  month: string
  members: number
}

export interface CollectionPoint {
  month: string
  collected: number
  target: number
}

export interface GroupCollection {
  groupId: string
  name: string
  collected: number
  outstanding: number
}

export interface RegistrationTrendPoint {
  month: string
  applied: number
  approved: number
  rejected: number
}