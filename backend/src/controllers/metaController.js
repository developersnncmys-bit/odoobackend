// Meta — exposes the controlled vocabularies the UI needs to populate dropdowns.
import {
  BUSINESS_CATEGORIES, LEAD_SOURCES, OPPORTUNITY_STAGES,
  PRIORITIES, DEPARTMENTS,
} from '../utils/constants.js'

export function get(_req, res) {
  res.json({
    businessCategories: BUSINESS_CATEGORIES,
    leadSources:        LEAD_SOURCES,
    opportunityStages:  OPPORTUNITY_STAGES,
    priorities:         PRIORITIES,
    departments:        DEPARTMENTS,
  })
}
