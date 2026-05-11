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
export const PROPOSAL_CATEGORIES = ['Corporate Proposal', 'Wedding Proposal', 'MICE Proposal', 'Exhibition Proposal', 'Virtual Event Proposal']

export const INVOICE_STATUSES = ['Pending', 'Sent', 'Paid', 'Overdue']

export const CALENDAR_TYPES = ['event', 'setup', 'recce', 'meeting']

export const DOCUMENT_TYPES = ['Proposal', 'Quotation', 'PO', 'Vendor Contract', 'Client Brief', 'Design', 'Invoice', 'Event Report', 'Other']

export const ROLES = ['Admin', ...DEPARTMENTS]

export const BUSINESS_CATEGORIES = [
  { id: 'corporate',  label: 'Corporate Events', types: ['Conference', 'Annual Event', 'Townhall', 'CSR Activity', 'Trade Show', 'Inauguration', 'Milestone Celebration', 'Family Day', 'Festive Celebration', 'Partner Meet', 'Team Building'] },
  { id: 'wedding',    label: 'Weddings',          types: ['Wedding', 'Engagement', 'Theme Party', 'Baby Shower', 'Birthday'] },
  { id: 'mice',       label: 'MICE',              types: ['Meeting', 'Incentive', 'Conference', 'Exhibition'] },
  { id: 'exhibition', label: 'Exhibitions',       types: ['Trade Exhibition', 'Product Showcase', 'Expo Booth'] },
]

export const GST_RATE = 0.18
