import type {
  AdminUser,
  Advertisement,
  Announcement,
  City,
  CommunityEvent,
  CommunityInfo,
  FeeConfig,
  Member,
  Notification,
  PaymentTransaction,
  Registration,
  Role,
  PermissionKey,
  SocialGroup,
  Trustee,
} from "@/types"

export const FISCAL_YEAR = "2025-26"

const makeGroups = (): SocialGroup[] => [
  { id: "g1", code: "GRP-MUM", name: "Mumbai Jain Yuvak Mandal", city: "Mumbai", state: "Maharashtra", chairperson: "Rajesh Shah", contact: "+91 98200 11223", email: "contact@mumbaijym.org", memberCount: 420, category: "Youth", foundedYear: 1985, status: "active" },
  { id: "g2", code: "GRP-AHM", name: "Ahmedabad Jain Parishad", city: "Ahmedabad", state: "Gujarat", chairperson: "Nitin Mehta", contact: "+91 98250 33445", email: "info@ahmedabadjainparishad.org", memberCount: 610, category: "Community", foundedYear: 1962, status: "active" },
  { id: "g3", code: "GRP-DEL", name: "Delhi Jain Samaj", city: "New Delhi", state: "Delhi", chairperson: "Anil Kumar Jain", contact: "+91 98110 55667", email: "hello@delhijainsamaj.org", memberCount: 820, category: "Community", foundedYear: 1948, status: "active" },
  { id: "g4", code: "GRP-JAI", name: "Jaipur Jain Sangh", city: "Jaipur", state: "Rajasthan", chairperson: "Sunil Khandelwal", contact: "+91 98290 77889", email: "sangh@jaipurjains.org", memberCount: 390, category: "Community", foundedYear: 1971, status: "active" },
  { id: "g5", code: "GRP-IND", name: "Indore Jain Mitra Mandal", city: "Indore", state: "Madhya Pradesh", chairperson: "Gaurav Bhandari", contact: "+91 98270 99001", email: "jmm@indorejains.org", memberCount: 265, category: "Social", foundedYear: 1990, status: "active" },
  { id: "g6", code: "GRP-SUR", name: "Surat Jain Yuva Sangh", city: "Surat", state: "Gujarat", chairperson: "Kunal Doshi", contact: "+91 98240 22110", email: "connect@suratjys.org", memberCount: 345, category: "Youth", foundedYear: 1998, status: "active" },
  { id: "g7", code: "GRP-PUN", name: "Pune Jain Seva Mandal", city: "Pune", state: "Maharashtra", chairperson: "Milind Vora", contact: "+91 98220 44332", email: "seva@punejains.org", memberCount: 285, category: "Seva", foundedYear: 1975, status: "active" },
  { id: "g8", code: "GRP-BLR", name: "Bengaluru Jain Association", city: "Bengaluru", state: "Karnataka", chairperson: "Rahul Kothari", contact: "+91 98450 66554", email: "office@blrjains.org", memberCount: 480, category: "Community", foundedYear: 1980, status: "active" },
  { id: "g9", code: "GRP-NAG", name: "Nagpur Jain Mahasabha", city: "Nagpur", state: "Maharashtra", chairperson: "Amit Chhajed", contact: "+91 98230 88776", email: "njm@nagpurjains.org", memberCount: 220, category: "Community", foundedYear: 1955, status: "active" },
  { id: "g10", code: "GRP-UDA", name: "Udaipur Jain Relief Committee", city: "Udaipur", state: "Rajasthan", chairperson: "Rakesh Ranka", contact: "+91 98290 12345", email: "relief@udaipurjains.org", memberCount: 175, category: "Seva", foundedYear: 1968, status: "active" },
  { id: "g11", code: "GRP-SOL", name: "Solapur Jain Samaj", city: "Solapur", state: "Maharashtra", chairperson: "Vishal Jain", contact: "+91 98220 66778", email: "samaj@solapurjains.org", memberCount: 150, category: "Community", foundedYear: 1972, status: "active" },
  { id: "g12", code: "GRP-KOL", name: "Kolhapur Jain Panchayat", city: "Kolhapur", state: "Maharashtra", chairperson: "Sachin Gandhi", contact: "+91 98230 44556", email: "panchayat@kolhapurjains.org", memberCount: 130, category: "Community", foundedYear: 1978, status: "active" },
]

const groups = makeGroups()

const groupOf = (id: string) => groups.find((g) => g.id === id)

const memberNames: Array<[string, string, "Male" | "Female"]> = [
  ["Rohan Shah", "Mumbai", "Male"], ["Priya Mehta", "Mumbai", "Female"], ["Aarav Jain", "Mumbai", "Male"],
  ["Isha Kothari", "Mumbai", "Female"], ["Vihaan Bhandari", "Mumbai", "Male"], ["Ananya Vora", "Mumbai", "Female"],
  ["Kabir Oswal", "Mumbai", "Male"], ["Myra Chhajed", "Mumbai", "Female"], ["Devansh Shah", "Mumbai", "Male"],
  ["Sana Doshi", "Mumbai", "Female"], ["Nikhil Mehta", "Ahmedabad", "Male"], ["Divya Shah", "Ahmedabad", "Female"],
  ["Kunal Gandhi", "Ahmedabad", "Male"], ["Ritika Soni", "Ahmedabad", "Female"], ["Harsh Rathi", "Ahmedabad", "Male"],
  ["Neha Sheth", "Ahmedabad", "Female"], ["Jay Suthar", "Ahmedabad", "Male"], ["Kavya Jhaveri", "Ahmedabad", "Female"],
  ["Amit Kumar Jain", "New Delhi", "Male"], ["Ritu Jain", "New Delhi", "Female"], ["Sahil Arora", "New Delhi", "Male"],
  ["Pooja Wadhwa", "New Delhi", "Female"], ["Rahul Saluja", "New Delhi", "Male"], ["Megha Bansal", "New Delhi", "Female"],
  ["Vikram Goel", "New Delhi", "Male"], ["Kritika Kapoor", "New Delhi", "Female"], ["Tarun Aggarwal", "New Delhi", "Male"],
  ["Naina Dass", "New Delhi", "Female"], ["Suresh Khandelwal", "Jaipur", "Male"], ["Shreya Vijay", "Jaipur", "Female"],
  ["Mohit Bothra", "Jaipur", "Male"], ["Aastha Singhi", "Jaipur", "Female"], ["Gaurav Saraf", "Jaipur", "Male"],
  ["Ridhi Baid", "Jaipur", "Female"], ["Deepak Lunawat", "Jaipur", "Male"], ["Tanvi Maheshwari", "Jaipur", "Female"],
  ["Rajat Bhandari", "Indore", "Male"], ["Nidhi Solanki", "Indore", "Female"], ["Aman Choudhary", "Indore", "Male"],
  ["Shruti Agrawal", "Indore", "Female"], ["Karan Bothra", "Indore", "Male"], ["Palak Jain", "Indore", "Female"],
  ["Nirav Doshi", "Surat", "Male"], ["Heena Desai", "Surat", "Female"], ["Mihir Shah", "Surat", "Male"],
  ["Devika Parikh", "Surat", "Female"], ["Chirag Sanghvi", "Surat", "Male"], ["Kinjal Vakharia", "Surat", "Female"],
  ["Ajay Vora", "Pune", "Male"], ["Pallavi Panchal", "Pune", "Female"], ["Sameer Kulkarni", "Pune", "Male"],
  ["Shraddha Pande", "Pune", "Female"], ["Nilesh Gandhi", "Pune", "Male"], ["Tanuja Joshi", "Pune", "Female"],
  ["Karthik Kothari", "Bengaluru", "Male"], ["Anusha Hegde", "Bengaluru", "Female"], ["Rohit Shetty", "Bengaluru", "Male"],
  ["Lakshmi Murthy", "Bengaluru", "Female"], ["Sanjay Rathi", "Bengaluru", "Male"], ["Divya Rao", "Bengaluru", "Female"],
  ["Arjun Chhajed", "Nagpur", "Male"], ["Sneha Bafna", "Nagpur", "Female"], ["Prashant Nawal", "Nagpur", "Male"],
  ["Jyoti Daga", "Nagpur", "Female"], ["Om Prakash Ranka", "Udaipur", "Male"], ["Manisha Maheshwari", "Udaipur", "Female"],
  ["Hitesh Golechha", "Udaipur", "Male"], ["Sapna Kothari", "Udaipur", "Female"], ["Manoj Jain", "Solapur", "Male"],
  ["Kiran Aachha", "Solapur", "Female"], ["Ravi Lunawat", "Solapur", "Male"], ["Deepali Khabia", "Solapur", "Female"],
  ["Santosh Gandhi", "Kolhapur", "Male"], ["Pradnya Purandare", "Kolhapur", "Female"], ["Sachin Khabiya", "Kolhapur", "Male"],
  ["Vaishali Rathi", "Kolhapur", "Female"], ["Navin Surana", "Mumbai", "Male"], ["Komal Shah", "Mumbai", "Female"],
  ["Yash Sanghavi", "Mumbai", "Male"], ["Mitali Doshi", "Mumbai", "Female"], ["Rohan Jain", "New Delhi", "Male"],
  ["Simran Goyal", "New Delhi", "Female"], ["Aditya Chopra", "New Delhi", "Male"], ["Kavita Batra", "New Delhi", "Female"],
  ["Faisal Merchant", "Ahmedabad", "Male"], ["Zoya Gandhi", "Ahmedabad", "Female"], ["Prateek Somani", "Bengaluru", "Male"],
  ["Nandini Jain", "Bengaluru", "Female"], ["Vivek Taparia", "Pune", "Male"], ["Amruta Deshpande", "Pune", "Female"],
  ["Rohit Khatod", "Surat", "Male"], ["Dhara Shah", "Surat", "Female"], ["Shashank Kasliwal", "Indore", "Male"],
  ["Ishita Dhabhai", "Indore", "Female"], ["Paresh Chheda", "Jaipur", "Male"], ["Anjali Saraf", "Jaipur", "Female"],
]

const groupForCity: Record<string, string> = {
  Mumbai: "g1", Ahmedabad: "g2", "New Delhi": "g3", Jaipur: "g4", Indore: "g5",
  Surat: "g6", Pune: "g7", Bengaluru: "g8", Nagpur: "g9", Udaipur: "g10",
  Solapur: "g11", Kolhapur: "g12",
}

const cityState: Record<string, string> = {
  Mumbai: "Maharashtra", Ahmedabad: "Gujarat", "New Delhi": "Delhi", Jaipur: "Rajasthan",
  Indore: "Madhya Pradesh", Surat: "Gujarat", Pune: "Maharashtra", Bengaluru: "Karnataka",
  Nagpur: "Maharashtra", Udaipur: "Rajasthan", Solapur: "Maharashtra", Kolhapur: "Maharashtra",
}

const occupations = [
  "Business", "Engineer", "Doctor", "Teacher", "Advocate", "Chartered Accountant",
  "Consultant", "Banker", "Entrepreneur", "Architect", "Professor", "Software Developer",
]

const pad = (n: number, len = 5) => String(n).padStart(len, "0")
const iso = (d: Date) => d.toISOString().slice(0, 10)

const members: Member[] = memberNames.map(([name, city, gender], i) => {
  const joined = new Date(2021, 0, 1)
  joined.setMonth(joined.getMonth() + (i * 3) % 58)
  joined.setDate(5 + (i * 7) % 20)
  return {
    id: `m${i + 1}`,
    regNo: `MEM-${pad(i + 1)}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@jssg.in`,
    phone: `+91 9${String(8000000000 + i * 137913).slice(0, 9)}`,
    dob: iso(new Date(1958 + (i % 55), (i * 4) % 12, (i * 11) % 28 + 1)),
    gender,
    occupation: occupations[i % occupations.length],
    groupId: groupForCity[city],
    city,
    state: cityState[city],
    address: `${20 + i} ${["MG Road", "Ring Road", "Station Road", "Linking Road", "Park Street"][i % 5]}, ${city}`,
    familySize: (i % 4) + 1,
    joinedOn: iso(joined),
    status: i % 11 === 6 ? "inactive" : "active",
  }
})

const registrations: Registration[] = [
  { id: "r1", regNo: "REG-1042", name: "Kunal Shah", email: "kunal.shah@gmail.com", phone: "+91 98100 44556", gender: "Male", dob: "1992-04-18", groupId: "g1", city: "Mumbai", proposal: "Introduced by Rajesh Shah, President, Mumbai Jain Yuvak Mandal", appliedOn: "2026-09-14", status: "pending" },
  { id: "r2", regNo: "REG-1043", name: "Sanjana Doshi", email: "sanjana.d@outlook.com", phone: "+91 98240 77889", gender: "Female", dob: "1995-11-02", groupId: "g6", city: "Surat", proposal: "Applied through Surat Jain Yuva Sangh membership drive", appliedOn: "2026-09-15", status: "pending" },
  { id: "r3", regNo: "REG-1044", name: "Vikas Rathi", email: "vikas.rathi@yahoo.com", phone: "+91 98110 22334", gender: "Male", dob: "1988-07-23", groupId: "g3", city: "New Delhi", proposal: "Brother of existing member Amit Rathi", appliedOn: "2026-09-16", status: "pending" },
  { id: "r4", regNo: "REG-1045", name: "Nidhi Baid", email: "nidhi.baid@gmail.com", phone: "+91 98290 55667", gender: "Female", dob: "1997-01-30", groupId: "g4", city: "Jaipur", proposal: "Online registration form submission", appliedOn: "2026-09-17", status: "pending" },
  { id: "r5", regNo: "REG-1046", name: "Alok Khandelwal", email: "alok.k@rediffmail.com", phone: "+91 98230 11223", gender: "Male", dob: "1984-03-12", groupId: "g9", city: "Nagpur", proposal: "Referred by Nagpur Jain Mahasabha committee", appliedOn: "2026-09-18", status: "pending" },
  { id: "r6", regNo: "REG-1047", name: "Pooja Ranka", email: "pooja.ranka@gmail.com", phone: "+91 98290 99887", gender: "Female", dob: "1990-09-08", groupId: "g10", city: "Udaipur", proposal: "Member of Udaipur Jain Relief Committee volunteer team", appliedOn: "2026-09-19", status: "pending" },
  { id: "r7", regNo: "REG-1038", name: "Mitesh Sanghvi", email: "mitesh.s@gmail.com", phone: "+91 98220 44556", gender: "Male", dob: "1986-05-27", groupId: "g7", city: "Pune", proposal: "Transferred from Mumbai Jain Yuvak Mandal", appliedOn: "2026-09-05", status: "approved", reviewedBy: "Rohit Shah", reviewedOn: "2026-09-08" },
  { id: "r8", regNo: "REG-1039", name: "Ankit Somani", email: "ankit.somani@gmail.com", phone: "+91 98450 33445", gender: "Male", dob: "1993-12-15", groupId: "g8", city: "Bengaluru", proposal: "Applied during community health camp", appliedOn: "2026-09-07", status: "rejected", reviewedBy: "Rohit Shah", reviewedOn: "2026-09-09", notes: "Incomplete address verification details." },
]

const designations: Trustee["designation"][] = ["President", "Secretary", "Treasurer", "Vice President", "Joint Secretary", "Trustee Member"]

const trusteeNames = [
  "Rajesh Shah", "Pankaj Mehta", "Sonal Shah", "Deepak Khandelwal", "Kavita Bhandari",
  "Nimesh Doshi", "Arti Vora", "Prashant Kothari", "Bhavesh Chhajed", "Meena Ranka",
  "Harish Jain", "Swati Gandhi", "Akshay Shah", "Vipul Mehta", "Rekha Jain",
  "Sandeep Khandelwal", "Pooja Bhandari", "Jignesh Doshi", "Neha Kothari", "Arjun Maloo",
]

const trustees: Trustee[] = groups.flatMap((g, gi) =>
  designations.slice(0, gi % 3 === 0 ? 5 : 4).map((d, di) => {
    const name = trusteeNames[(gi * 4 + di) % trusteeNames.length]
    return {
      id: `t${gi * 10 + di}`,
      name,
      designation: d,
      groupId: g.id,
      city: g.city,
      phone: `+91 9820${String(100000 + gi * 1379 + di * 101).slice(0, 6)}`,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${g.code.toLowerCase().replace("grp-", "")}.org`,
      tenureFrom: `2023-04-01`,
      tenureTo: `2027-03-31`,
      status: di % 10 === 7 ? "inactive" : "active",
    }
  })
)

const cities: City[] = Object.entries(groupForCity).map(([city], i) => {
  return {
    id: `c${i + 1}`,
    name: city,
    state: cityState[city],
    region: ["West", "West", "North", "North", "Central", "West", "West", "South", "Central", "North", "West", "West"][i],
    groupCount: 1,
    memberCount: members.filter((m) => m.city === city).length,
    status: "active" as const,
  }
})

const communityInfo: CommunityInfo[] = [
  { id: "ci1", title: "About the Federation", category: "About", content: "The Jain Social Groups Federation is a voluntary umbrella body coordinating social, religious and seva activities across Jain social groups in India.", featured: true, updatedBy: "Rohit Shah", updatedOn: "2026-08-20", status: "published" },
  { id: "ci2", title: "Code of Conduct", category: "Policies", content: "All member groups must uphold the principles of Ahimsa, Anekantavad and Aparigraha in every activity and communication.", featured: false, updatedBy: "Meena Ranka", updatedOn: "2026-07-12", status: "published" },
  { id: "ci3", title: "Membership Guidelines", category: "Policies", content: "Individuals are eligible for federation membership through a recognised Jain social group. Each group verifies and forwards registrations.", featured: true, updatedBy: "Rohit Shah", updatedOn: "2026-06-30", status: "published" },
  { id: "ci4", title: "Seva Initiatives Overview", category: "Seva", content: "The federation supports annadanam, blood donation drives and education support for underprivileged Jain children.", featured: false, updatedBy: "Arti Vora", updatedOn: "2026-09-02", status: "published" },
  { id: "ci5", title: "Draft: Annual Convention Brief", category: "Events", content: "Draft brief for the upcoming annual federation convention to be hosted in Udaipur.", featured: false, updatedBy: "Rohit Shah", updatedOn: "2026-09-12", status: "draft" },
]

const events: CommunityEvent[] = [
  { id: "e1", title: "Paryushan Mahaparva 2026", category: "Religious", date: "2026-09-11", time: "06:30 AM", location: "Shree Agam Mandir Hall", city: "Mumbai", organizerId: "g1", attendeeCount: 220, capacity: 300, status: "ongoing", description: "Eight-day spiritual discourse and pratikraman sessions for the community." },
  { id: "e2", title: "Annual Federation Convention", category: "Community Meet", date: "2026-11-14", time: "09:00 AM", location: "Jain Bhavan Auditorium", city: "Udaipur", organizerId: "g10", attendeeCount: 120, capacity: 500, status: "upcoming", description: "Annual gathering of all member groups with elections and award ceremony." },
  { id: "e3", title: "Community Blood Donation Camp", category: "Seva", date: "2026-09-28", time: "08:00 AM", location: "Civic Hospital", city: "Ahmedabad", organizerId: "g2", attendeeCount: 0, capacity: 150, status: "upcoming", description: "Blood donation drive organised jointly with the district blood bank." },
  { id: "e4", title: "Yuva Leadership Workshop", category: "Educational", date: "2026-10-05", time: "10:00 AM", location: "FICCI Auditorium", city: "New Delhi", organizerId: "g3", attendeeCount: 45, capacity: 120, status: "upcoming", description: "Two-day leadership and communication workshop for young members." },
  { id: "e5", title: "Health Check-up & Eye Camp", category: "Health", date: "2026-08-16", time: "09:00 AM", location: "Samaj Bhavan", city: "Jaipur", organizerId: "g4", attendeeCount: 185, capacity: 200, status: "completed", description: "Free medical check-up and cataract screening for senior citizens." },
  { id: "e6", title: "Annadanam Seva Drive", category: "Seva", date: "2026-07-19", time: "11:00 AM", location: "Community Kitchen", city: "Indore", organizerId: "g5", attendeeCount: 96, capacity: 150, status: "completed", description: "Special annadanam for 500 guests at the community kitchen." },
  { id: "e7", title: "Das Lakshan Parva Celebrations", category: "Religious", date: "2026-10-01", time: "07:00 AM", location: "Jain Derasar Complex", city: "Surat", organizerId: "g6", attendeeCount: 0, capacity: 400, status: "upcoming", description: "Community worship, discourse and cultural programme." },
  { id: "e8", title: "Green Pune Initiative", category: "Environmental", date: "2026-08-22", time: "07:00 AM", location: "Vetal Tekdi", city: "Pune", organizerId: "g7", attendeeCount: 74, capacity: 120, status: "completed", description: "Tree plantation drive in collaboration with municipal forests." },
  { id: "e9", title: "Skill Development for Women", category: "Educational", date: "2026-11-20", time: "10:00 AM", location: "Karnataka Jain Sangh Hall", city: "Bengaluru", organizerId: "g8", attendeeCount: 0, capacity: 100, status: "upcoming", description: "Tailoring and financial literacy workshop for women members." },
  { id: "e10", title: "Senior Citizens Meet", category: "Social", date: "2026-09-05", time: "05:00 PM", location: "Mahasabha Hall", city: "Nagpur", organizerId: "g9", attendeeCount: 62, capacity: 90, status: "completed", description: "Evening get-together and felicitation of senior members." },
  { id: "e11", title: "Relief Drive for Flood-Affected Villages", category: "Seva", date: "2026-10-18", time: "07:30 AM", location: "Relief Camp", city: "Udaipur", organizerId: "g10", attendeeCount: 0, capacity: 250, status: "upcoming", description: "Relief kit distribution and rescue support for flood-hit families." },
  { id: "e12", title: "Cultural Evening: Bhajan Sandhya", category: "Cultural", date: "2026-09-25", time: "07:00 PM", location: "Samaj Hall", city: "Bengaluru", organizerId: "g8", attendeeCount: 0, capacity: 180, status: "upcoming", description: "An evening of devotional bhajans by community artists." },
]

const announcements: Announcement[] = [
  { id: "n1", title: "Paryushan schedules now live", category: "Religious", summary: "Complete Paryushan Mahaparva 2026 schedule for all member groups is now available.", author: "Rohit Shah", publishedOn: "2026-09-02", publishStatus: "published", pinned: true },
  { id: "n2", title: "Annual fee payment window opens", category: "Administrative", summary: "Annual federation fee payment for FY 2025-26 is now open until 15th October.", author: "Meena Ranka", publishedOn: "2026-09-10", publishStatus: "published", pinned: true },
  { id: "n3", title: "Convention registrations open", category: "Events", summary: "Register your group for the Annual Federation Convention in Udaipur.", author: "Rohit Shah", publishedOn: "2026-09-12", publishStatus: "published", pinned: false },
  { id: "n4", title: "New membership verification process", category: "Policies", summary: "Updated KYC guidelines for new member registration are now effective.", author: "Meena Ranka", publishedOn: "2026-08-25", publishStatus: "published", pinned: false },
  { id: "n5", title: "Blood donation camp volunteer call", category: "Seva", summary: "Volunteers needed for the community blood donation camp on 28th Sep.", author: "Arti Vora", publishedOn: "2026-09-14", publishStatus: "published", pinned: false },
  { id: "n6", title: "Draft: FY 2026-27 budget proposal", category: "Administrative", summary: "Preliminary budget proposal for the next fiscal year is under review.", author: "Meena Ranka", publishedOn: "2026-09-20", publishStatus: "draft", pinned: false },
  { id: "n7", title: "Das Lakshan Parva arrangements", category: "Religious", summary: "Arrangements for Das Lakshan Parva celebrations at member group venues.", author: "Rohit Shah", publishedOn: "2026-09-21", publishStatus: "scheduled", pinned: false },
]

const notifications: Notification[] = [
  { id: "nt1", title: "Paryushan Mahaparva begins", message: "Paryushan Mahaparva 2026 begins tomorrow. Check the event schedule and join the morning discourse sessions.", type: "info", audience: "All Members", groups: [], sentBy: "Rohit Shah", sentOn: "2026-09-10", status: "sent", delivered: 4860, opened: 3920 },
  { id: "nt2", title: "Annual fee payment reminder", message: "Reminder: Annual federation fee for FY 2025-26 is due by 15th October. Pay online to avoid late fees.", type: "warning", audience: "Group Treasurers", groups: ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10", "g11", "g12"], sentBy: "Meena Ranka", sentOn: "2026-09-15", status: "sent", delivered: 96, opened: 81 },
  { id: "nt3", title: "Convention venue announced", message: "Annual Federation Convention confirmed at Jain Bhavan, Udaipur on 14th November. Registrations open now.", type: "success", audience: "Group Secretaries", groups: [], sentBy: "Rohit Shah", sentOn: "2026-09-18", status: "sent", delivered: 96, opened: 74 },
  { id: "nt4", title: "Blood donation camp", message: "Community blood donation camp at Civic Hospital, Ahmedabad on 28th September. Donors and volunteers welcome.", type: "info", audience: "Ahmedabad Jain Parishad", groups: ["g2"], sentBy: "Arti Vora", sentOn: "2026-09-20", status: "sent", delivered: 610, opened: 512 },
  { id: "nt5", title: "Emergency: Flood relief support", message: "Volunteers requested for flood relief in Udaipur region. Report to the relief camp by 6 PM today.", type: "emergency", audience: "Udaipur Jain Relief Committee", groups: ["g10"], sentBy: "Rohit Shah", sentOn: "2026-09-22", status: "sent", delivered: 175, opened: 168 },
]

const ads: Advertisement[] = [
  { id: "a1", title: "Navkarshi Jewellers - Gold & Diamond", advertiser: "Navkarshi Jewellers", type: "Banner", placement: "Homepage Top", mediaLabel: "banner_navkarshi_728x90.png", startDate: "2026-09-01", endDate: "2026-11-30", status: "active", impressions: 48200, clicks: 1240, spend: 18500, submittedBy: "Deepak S.", submittedOn: "2026-08-25", approvedBy: "Rohit Shah" },
  { id: "a2", title: "Jain Prakrit Association", advertiser: "Jain Prakrit Association", type: "Sponsored Post", placement: "News Feed", mediaLabel: "post_jpa_course.jpg", startDate: "2026-09-10", endDate: "2026-10-10", status: "active", impressions: 12400, clicks: 380, spend: 6000, submittedBy: "Kavita J.", submittedOn: "2026-09-05", approvedBy: "Rohit Shah" },
  { id: "a3", title: "GreenLeaf Ayurveda Clinic", advertiser: "GreenLeaf Ayurveda", type: "Sidebar", placement: "Member Directory", mediaLabel: "sidebar_greenleaf_300x250.png", startDate: "2026-10-01", endDate: "2026-12-31", status: "approved", impressions: 0, clicks: 0, spend: 8000, submittedBy: "Rahul G.", submittedOn: "2026-09-18" },
  { id: "a4", title: "Shree Siddhi Textiles", advertiser: "Shree Siddhi Textiles", type: "Banner", placement: "Events Page Top", mediaLabel: "banner_siddhi_728x90.png", startDate: "2026-08-01", endDate: "2026-08-31", status: "expired", impressions: 31100, clicks: 720, spend: 7500, submittedBy: "Naveen T.", submittedOn: "2026-07-20", approvedBy: "Rohit Shah" },
  { id: "a5", title: "Annadanam Sponsorship Drive", advertiser: "Saksham Foundation", type: "Popup", placement: "All Pages", mediaLabel: "popup_saksham_annadanam.jpg", startDate: "2026-09-20", endDate: "2026-10-20", status: "pending", impressions: 0, clicks: 0, spend: 12000, submittedBy: "Meera S.", submittedOn: "2026-09-19" },
  { id: "a6", title: "Vegan Food Festival", advertiser: "Sattvik Foods", type: "Sponsored Post", placement: "News Feed", mediaLabel: "post_sattvik_fest.jpg", startDate: "2026-10-05", endDate: "2026-10-15", status: "pending", impressions: 0, clicks: 0, spend: 4500, submittedBy: "Ajay K.", submittedOn: "2026-09-21" },
  { id: "a7", title: "Sparsh Books - Jain Literature", advertiser: "Sparsh Books", type: "Sidebar", placement: "Community Info", mediaLabel: "sidebar_sparsh_300x250.png", startDate: "2026-07-01", endDate: "2026-09-30", status: "expired", impressions: 21400, clicks: 430, spend: 5200, submittedBy: "Pooja V.", submittedOn: "2026-06-15", approvedBy: "Rohit Shah" },
  { id: "a8", title: "Sangam Realty Pune", advertiser: "Sangam Realty", type: "Banner", placement: "Homepage Middle", mediaLabel: "banner_sangam_728x90.png", startDate: "2026-09-12", endDate: "2026-12-31", status: "rejected", impressions: 0, clicks: 0, spend: 10000, submittedBy: "Rakesh M.", submittedOn: "2026-09-08", approvedBy: "Rohit Shah" },
]

const roles: Role[] = [
  { id: "role-super", name: "Super Admin", description: "Full system access including roles, approvals and all configuration.", type: "System", users: 2, permissions: allPermissions(true) },
  { id: "role-federation", name: "Federation Admin", description: "Manages members, groups, content, events and community operations.", type: "System", users: 4, permissions: allPermissions(false) },
  { id: "role-finance", name: "Finance Officer", description: "Annual fees, payments and financial reports.", type: "System", users: 3, permissions: allPermissions(false) },
  { id: "role-group", name: "Group Admin", description: "Manages the members and data of a single social group.", type: "System", users: 12, permissions: allPermissions(false) },
  { id: "role-content", name: "Content Manager", description: "Publishes news, community info and event updates.", type: "System", users: 5, permissions: allPermissions(false) },
  { id: "role-viewer", name: "Auditor", description: "Read-only access to reports, directory and payment summaries.", type: "Custom", users: 2, permissions: allPermissions(false) },
]

function allPermissions(value: boolean): Record<PermissionKey, boolean> {
  return {
    "members.view": value, "members.manage": value, "registrations.approve": value,
    "trustees.manage": value, "groups.manage": value, "locations.manage": value,
    "community.manage": value, "events.manage": value, "news.manage": value,
    "notifications.send": value, "ads.approve": value, "roles.manage": value,
    "reports.view": value, "fees.manage": value, "payments.view": value, "payments.refund": value,
  }
}

const rolePermissions: Partial<Record<string, Record<PermissionKey, boolean>>> = {
  "role-federation": {
    ...allPermissions(false),
    "members.manage": true, "groups.manage": true, "registrations.approve": true,
    "community.manage": true, "events.manage": true, "notifications.send": true,
  },
  "role-finance": { ...allPermissions(false), "fees.manage": true, "payments.view": true, "payments.refund": true, "reports.view": true },
  "role-group": { ...allPermissions(false), "members.manage": true, "events.manage": true },
  "role-content": { ...allPermissions(false), "community.manage": true, "events.manage": true, "news.manage": true },
  "role-viewer": { ...allPermissions(false), "members.view": true, "reports.view": true, "payments.view": true },
}

roles.forEach((r) => {
  if (r.id !== "role-super") r.permissions = { ...r.permissions, ...(rolePermissions[r.id] ?? {}) }
})

const adminUsers: AdminUser[] = [
  { id: "u1", name: "Rohit Shah", email: "rohit.shah@jssg.in", roleId: "role-super", status: "active", lastLogin: "2026-09-23 08:42", memberSince: "2019-04-01" },
  { id: "u2", name: "Meena Ranka", email: "meena.ranka@jssg.in", roleId: "role-finance", status: "active", lastLogin: "2026-09-22 17:15", memberSince: "2020-01-15" },
  { id: "u3", name: "Arti Vora", email: "arti.vora@jssg.in", roleId: "role-content", status: "active", lastLogin: "2026-09-23 09:03", memberSince: "2021-06-10" },
  { id: "u4", name: "Deepak Khandelwal", email: "deepak.k@jssg.in", roleId: "role-group", status: "active", lastLogin: "2026-09-19 12:30", memberSince: "2018-08-22" },
  { id: "u5", name: "Sonal Shah", email: "sonal.shah@jssg.in", roleId: "role-federation", status: "inactive", lastLogin: "2026-07-30 10:12", memberSince: "2019-11-05" },
  { id: "u6", name: "Kavita Bhandari", email: "kavita.b@jssg.in", roleId: "role-viewer", status: "active", lastLogin: "2026-09-21 14:55", memberSince: "2022-03-18" },
]

const feeConfigs: FeeConfig[] = groups.map((g, i) => {
  const rate = 0.82
  return {
    groupId: g.id,
    fiscalYear: FISCAL_YEAR,
    amount: 15000,
    dueDate: "2026-10-15",
    lateFee: 2000,
    cycle: "Annual",
    status: "open",
    collected: Math.round(g.memberCount * 15000 * (rate - i * 0.008) / 100) * 100,
    collectionRate: Math.round((rate - i * 0.008) * 1000) / 10,
    totalMembers: g.memberCount,
    paidMembers: Math.round(g.memberCount * (rate - i * 0.008)),
  }
})

const paymentMethods: PaymentTransaction["method"][] = ["UPI", "Bank Transfer", "Cheque", "Cash", "Card", "UPI", "Bank Transfer"]

const transactions: PaymentTransaction[] = groups.flatMap((g, gi) => {
  const paid = feeConfigs[gi].paidMembers
  const perGroup: PaymentTransaction[] = []
  const count = Math.floor(paid / 5)
  for (let j = 0; j < count; j++) {
    const date = new Date(2026, 7, 22 + (j % 8))
    if (j >= 8) date.setDate(5 + ((j * (gi + 2)) % 15))
    const method = paymentMethods[j % paymentMethods.length]
    perGroup.push({
      id: `tx-${g.id}-${j}`,
      txnNo: `TXN${pad(gi * 200 + j + 1)}`,
      receiptNo: `RCP${pad(gi * 200 + j + 1)}`,
      payerName: `Member of ${g.name}`,
      groupId: g.id,
      fiscalYear: FISCAL_YEAR,
      amount: 15000,
      method,
      status: "success",
      paidOn: iso(date),
      remark: `Annual fee FY ${FISCAL_YEAR}`,
    })
  }
  return perGroup
}).slice(0, 140)

const db = {
  groups,
  members,
  registrations,
  trustees,
  cities,
  communityInfo,
  events,
  announcements,
  notifications,
  ads,
  roles,
  adminUsers,
  feeConfigs,
  transactions,
}

let seq = 1000
const nextId = () => `gen-${++seq}`

export function resetDb() {
  db.groups.splice(0, db.groups.length, ...makeGroups())
  db.members.splice(0, db.members.length, ...members)
  db.registrations.splice(0, db.registrations.length, ...registrations)
  db.trustees.splice(0, db.trustees.length, ...trustees)
  db.cities.splice(0, db.cities.length, ...cities)
  db.communityInfo.splice(0, db.communityInfo.length, ...communityInfo)
  db.events.splice(0, db.events.length, ...events)
  db.announcements.splice(0, db.announcements.length, ...announcements)
  db.notifications.splice(0, db.notifications.length, ...notifications)
  db.ads.splice(0, db.ads.length, ...ads)
  db.roles.splice(0, db.roles.length, ...roles)
  db.adminUsers.splice(0, db.adminUsers.length, ...adminUsers)
  db.feeConfigs.splice(0, db.feeConfigs.length, ...feeConfigs)
  db.transactions.splice(0, db.transactions.length, ...transactions)
}

export { db, nextId, groupOf }

export async function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}