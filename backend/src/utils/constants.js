// Single source of truth for controlled vocabularies used by both models
// (schema-level enum validation) and controllers (request-body validation).

export const OPPORTUNITY_STAGES = [
  'New', 'Contacted', 'Requirement Gathering', 'Brief Documentation',
  'Venue Recce', 'Concept Development', 'Proposal Submission',
  'Client Feedback', 'Negotiation', 'Won', 'Lost',
]

export const PRIORITIES   = ['Low', 'Medium', 'High', 'Urgent']
export const DEPARTMENTS  = ['Business Development', 'Client Servicing', 'Production', 'Design', 'Accounts', 'Management']
export const LEAD_SOURCES = ['Website', 'Referral', 'Cold Call', 'Email Campaign', 'LinkedIn', 'Instagram', 'Walk-in', 'Existing Client']

export const PROJECT_STATUSES   = ['Awaiting PO', 'In Production', 'On Hold', 'Completed']
export const EXECUTION_STAGES   = ['Pre-Event', 'Event Day', 'Post-Event']
export const TASK_STATUSES      = ['Pending', 'In Progress', 'Done', 'Delayed']
export const VENDOR_STATUSES    = ['Pending', 'Confirmed', 'Cancelled']

export const PROPOSAL_STATUSES   = ['Draft', 'Sent', 'Approved', 'Rejected']
// Aligned with the three service verticals on absoluteconcepts.in
export const PROPOSAL_CATEGORIES = ['Corporate Proposal', 'Wedding Proposal', 'Social Events Proposal']

export const INVOICE_STATUSES = ['Pending', 'Sent', 'Paid', 'Overdue']

export const CALENDAR_TYPES = ['event', 'setup', 'recce', 'meeting']

export const DOCUMENT_TYPES = ['Proposal', 'Quotation', 'PO', 'Vendor Contract', 'Client Brief', 'Design', 'Invoice', 'Event Report', 'Other']

export const ROLES = ['Admin', ...DEPARTMENTS]

// Service verticals — taken verbatim from absoluteconcepts.in
// (https://absoluteconcepts.in/services/). MICE, Inaugurations, Trade Shows
// and Conferences are SUB-TYPES under Corporate Events on the live site, not
// separate top-level categories.
export const BUSINESS_CATEGORIES = [
  {
    id: 'corporate',
    label: 'Corporate Events',
    types: [
      'MICE (Meetings, Incentives, Conferences & Exhibitions)',
      'Inauguration / Factory Inauguration',
      'Annual Corporate Event',
      'Conference / Seminar',
      'Trade Show / Workshop',
      'Team Building Activity',
      'Shareholder Meeting',
      'Company Milestone / Founder\'s Day',
      'Sales, Dealers & Supplier Conference',
      'Destination Corporate Event',
      'CSR Event',
    ],
  },
  {
    id: 'wedding',
    label: 'Wedding',
    types: [
      'Wedding',
      'Engagement',
      'Pre-Wedding Function',
      'Reception',
    ],
  },
  {
    id: 'social',
    label: 'Social Events',
    types: [
      'Birthday Celebration',
      'Anniversary Celebration',
      'Jubilee Celebration',
      'Teenage Celebration',
      'Fashion Show',
      'Baby Shower',
      'Naming Ceremony',
      'Kitty Party',
      'Theme Party',
      'Candlelight Dinner Setup',
      'Room Decoration',
    ],
  },
]

export const GST_RATE = 0.18
