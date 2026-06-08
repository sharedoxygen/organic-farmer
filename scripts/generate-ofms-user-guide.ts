import fs from 'fs'
import path from 'path'
import { globSync } from 'glob'
import { program } from 'commander'
import sharp from 'sharp'
import {
    AlignmentType,
    BorderStyle,
    convertInchesToTwip,
    Document,
    Footer,
    Header,
    HeadingLevel,
    ImageRun,
    Packer,
    PageBreak,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TableOfContents,
    TextRun,
    VerticalAlign,
    WidthType,
} from 'docx'

const SCREENSHOT_VIEWPORT_WIDTH = 1440
const SCREENSHOT_VIEWPORT_HEIGHT = 900
const SCREENSHOT_ASPECT_RATIO = SCREENSHOT_VIEWPORT_HEIGHT / SCREENSHOT_VIEWPORT_WIDTH
const GUIDE_SCREENSHOT_WIDTH = 620
const GUIDE_SCREENSHOT_HEIGHT = Math.round(GUIDE_SCREENSHOT_WIDTH * SCREENSHOT_ASPECT_RATIO)

type NavItem = { label: string; href: string }

function titleFromRoute(route: string): string {
    if (route === '/') return 'Home'
    const segs = route.split('/').filter(Boolean)
    const last = segs[segs.length - 1] || ''
    const cleaned = last.replace(/\[|\]/g, '').replace(/-/g, ' ')
    return cleaned
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
}

function safeString(v: unknown): string | null {
    if (typeof v !== 'string') return null
    const t = v.trim()
    if (!t) return null
    return t
}

function parseCrudFieldObjects(body: string): CrudFieldDef[] {
    const fields: CrudFieldDef[] = []

    const objRegex = /\{([\s\S]*?)\}/g
    let m: RegExpExecArray | null
    while ((m = objRegex.exec(body)) !== null) {
        const obj = m[1]
        const name = safeString(obj.match(/name:\s*'([^']+)'/)?.[1])
        const label = safeString(obj.match(/label:\s*'([^']+)'/)?.[1])
        const type = safeString(obj.match(/type:\s*'([^']+)'/)?.[1])
        if (!name || !label || !type) continue

        const required = /required:\s*true/.test(obj)
        const placeholder = safeString(obj.match(/placeholder:\s*'([^']+)'/)?.[1]) || undefined

        const optionsBody = obj.match(/options:\s*\[([\s\S]*?)\]/)?.[1]
        let options: Array<{ value: string; label: string }> | undefined
        if (optionsBody) {
            const optRegex = /\{\s*value:\s*'([^']+)'\s*,\s*label:\s*'([^']+)'\s*\}/g
            const opts: Array<{ value: string; label: string }> = []
            let om: RegExpExecArray | null
            while ((om = optRegex.exec(optionsBody)) !== null) {
                opts.push({ value: om[1], label: om[2] })
            }
            if (opts.length) options = opts
        }

        fields.push({ name, label, type, required: required || undefined, placeholder, options })
    }

    const uniq = new Map<string, CrudFieldDef>()
    for (const f of fields) {
        uniq.set(f.name, f)
    }
    return Array.from(uniq.values())
}

function parseCrudSections(content: string): CrudSectionDef[] | null {
    const sectionsMatch = content.match(/sections=\{?[\s\S]*?\[([\s\S]*?)\][\s\S]*?\}?\s*\}\s*\/?\>/)
    const body = sectionsMatch?.[1]
    if (!body) return null

    const sections: CrudSectionDef[] = []
    const sectionRegex = /\{\s*title:\s*'([^']+)'\s*,\s*fields:\s*\[([^\]]*)\]\s*\}/g
    let m: RegExpExecArray | null
    while ((m = sectionRegex.exec(body)) !== null) {
        const title = m[1]
        const fieldsRaw = m[2]
        const fields = Array.from(fieldsRaw.matchAll(/'([^']+)'/g)).map(x => x[1])
        sections.push({ title, fields })
    }
    return sections.length ? sections : null
}

function extractCrudFormsFromPage(pagePath: string): PageFormDef | null {
    if (!fs.existsSync(pagePath)) return null
    const content = fs.readFileSync(pagePath, 'utf8')

    const title = safeString(content.match(/title=\{\s*\n?\s*modalMode[\s\S]*?\?\s*'([^']+)'/)?.[1]) || null
    const fieldsByKey: Record<string, CrudFieldDef[]> = {}

    const arrayRegex = /const\s+(\w+)\s*:\s*CrudField\[\]\s*=\s*\[([\s\S]*?)\];/g
    let m: RegExpExecArray | null
    while ((m = arrayRegex.exec(content)) !== null) {
        const key = m[1]
        const body = m[2]
        const fields = parseCrudFieldObjects(body)
        if (fields.length) fieldsByKey[key] = fields
    }

    const sections = parseCrudSections(content)
    if (!Object.keys(fieldsByKey).length && !sections) return null

    return { title, fieldsByKey, sections }
}

function buildPageGuides(pages: UiPage[]): PageGuide[] {
    const guides: PageGuide[] = []

    for (const pg of pages) {
        const purpose =
            pg.route === '/dashboard'
                ? 'Start your day here: monitor KPIs, review alerts, and jump into today’s work.'
                : pg.route.startsWith('/production')
                    ? 'Run day-to-day production: seeding, tracking batches, harvesting, and post-harvest handling.'
                    : pg.route.startsWith('/planning')
                        ? 'Plan what you will grow, when, and how much—so operations and sales stay aligned.'
                        : pg.route.startsWith('/quality') || pg.route.startsWith('/compliance')
                            ? 'Verify quality and compliance, capture checks, and keep your records audit-ready.'
                            : pg.route.startsWith('/inventory')
                                ? 'Track supplies and stock levels so the team never runs out of critical inputs.'
                                : pg.route.startsWith('/sales')
                                    ? 'Manage customers and orders from request through fulfillment.'
                                    : pg.route.startsWith('/traceability')
                                        ? 'Trace every batch and event for audits, recalls, and customer confidence.'
                                        : pg.route.startsWith('/analytics')
                                            ? 'Analyze operational performance, yield metrics, and financial outcomes.'
                                            : pg.route.startsWith('/feedback')
                                                ? 'Submit and track feedback to improve OFMS workflows and features.'
                                                : pg.route.startsWith('/ai')
                                                    ? 'Access AI-powered insights for cultivation optimization and demand forecasting.'
                                                    : 'Configure and manage this operational component.'

        guides.push({
            route: pg.route,
            file: pg.file,
            module: pg.module,
            purpose,
            primaryForms: extractCrudFormsFromPage(path.join(process.cwd(), pg.file)),
        })
    }

    return guides
}

type RoutePlaybook = {
    steps: string[]
    outputs: string[]
    pitfalls: string[]
}

function routePlaybook(route: string): RoutePlaybook {
    const byRoute: Record<string, RoutePlaybook> = {
        '/dashboard': {
            steps: [
                'Confirm you are in the correct Farm (tenant) in the header selector.',
                'Scan KPIs: active batches, ready-to-harvest, pending orders, and recent activity.',
                'Open the highest-priority alerts first and assign follow-up tasks if needed.',
                'Use quick navigation cards to jump directly into today’s work.',
            ],
            outputs: ['A clear daily plan: what is urgent, what can wait, and which module to open next.'],
            pitfalls: ['Working in the wrong farm context and recording data to the wrong operation.'],
        },
        '/planning/crops': {
            steps: [
                'Review upcoming crop plans and confirm target start dates.',
                'Cross-check planned starts against available capacity and labor.',
                'Adjust quantities and timing to match expected demand and sales commitments.',
            ],
            outputs: ['A forward-looking plan that prevents overproduction/underproduction.'],
            pitfalls: ['Planning without checking inventory availability for inputs and packaging.'],
        },
        '/planning/calendar': {
            steps: [
                'Use the calendar view to see upcoming starts, harvest windows, and key deadlines.',
                'Identify collisions: too many harvests on the same day or staffing bottlenecks.',
                'Move work earlier/later to smooth labor and facility usage.',
            ],
            outputs: ['A balanced schedule that your team can actually execute.'],
            pitfalls: ['Treating the calendar as a report instead of a planning tool—make changes early.'],
        },
        '/planning/forecasting': {
            steps: [
                'Review the forecast signal and compare to actual orders and pipeline.',
                'Confirm assumptions: expected yields, cycle times, and seasonality.',
                'Use forecast insights to adjust crop plan quantities and harvest timing.',
            ],
            outputs: ['A planning baseline that links operations to demand.'],
            pitfalls: ['Overfitting to a single week—review trends and re-forecast regularly.'],
        },
        '/planning/resources': {
            steps: [
                'Review resource constraints: rooms/zones, equipment, and labor.',
                'Confirm equipment readiness and maintenance windows.',
                'Align the schedule to avoid running out of critical resources mid-cycle.',
            ],
            outputs: ['A realistic plan that matches facility constraints.'],
            pitfalls: ['Ignoring equipment availability until the day of harvest or packaging.'],
        },
        '/production/batches': {
            steps: [
                'Create a new batch when clones are planted or seeds germinate (e.g., "BD-2024-047" for Blue Dream batch 47 of 2024).',
                'Update status as the batch moves through growth stages: Clone → Vegetative (18/6 light) → Flowering (12/12 light) → Harvest.',
                'Record key events: room transfers (Veg Room 2 → Flower Room 1), plant counts, and any culled plants.',
                'At Shared Oxygen, batches average 50-100 plants and 8-10 week flower cycles depending on strain.',
            ],
            outputs: ['A complete batch record with plant counts, growth stage history, and room assignments for state compliance.'],
            pitfalls: ['Updating statuses late—state regulators require real-time plant tracking; enter events daily.'],
        },
        '/production/harvesting': {
            steps: [
                'Review batches in late flower (week 7-10 depending on strain) and check trichome maturity.',
                'Record harvest date, wet weight (e.g., 4.2 lbs from 50 plants), and quality notes (trichome color, bud density).',
                'Assign harvested material to drying room and create post-harvest tracking record.',
                'At Shared Oxygen, typical yields: Blue Dream 3-4 oz/plant, OG Kush 2-3 oz/plant dried weight.',
            ],
            outputs: ['Harvest records with wet weight, plant count, and drying room assignment linked to source batch.'],
            pitfalls: ['Forgetting to weigh and record wet weight before drying—required for yield calculations and state reporting.'],
        },
        '/production/post-harvest': {
            steps: [
                'Track drying progress (typically 7-14 days at 60°F/60% RH until stems snap).',
                'Record dry weight and calculate moisture loss (expect 70-80% weight reduction from wet).',
                'Document curing process: jar/bin assignment, burping schedule, and cure duration (2-8 weeks).',
                'Create finished goods inventory with lot numbers (e.g., "GDP-LOT-2024-156") when packaging is complete.',
            ],
            outputs: ['Complete post-harvest trail: wet weight → dry weight → cure → package → lot number for each batch.'],
            pitfalls: ['Skipping cure documentation—affects quality claims and makes investigating customer complaints difficult.'],
        },
        '/production/seeds': {
            steps: [
                'Add strains with consistent naming: "Blue Dream" not "BlueDream" or "Blue dream".',
                'Record strain details: genetics (Sativa/Indica/Hybrid %), typical flower time (8-10 weeks), expected yield.',
                'Track clone mothers separately if maintaining genetics in-house.',
                'Shared Oxygen strains: Blue Dream (Hybrid, 9 weeks), OG Kush (Indica, 8 weeks), Girl Scout Cookies (Hybrid, 9-10 weeks), Sour Diesel (Sativa, 10 weeks), Granddaddy Purple (Indica, 8 weeks).',
            ],
            outputs: ['A strain catalog with genetics, grow characteristics, and yield expectations for planning.'],
            pitfalls: ['Inconsistent strain names that break reporting and make compliance audits confusing.'],
        },
        '/quality/control': {
            steps: [
                'Create quality checks at critical control points: pre-harvest inspection, post-dry inspection, pre-package inspection.',
                'Record visual inspection results: trichome development, mold/mildew check, pest inspection, bud structure.',
                'Attach lab COA (Certificate of Analysis) when received: THC/CBD potency, terpene profile, pesticide/heavy metal/microbial testing.',
                'At Shared Oxygen, all batches require passing COA before packaging—typical turnaround 3-5 business days.',
            ],
            outputs: ['Quality records with inspection results and lab COAs linked to each batch for compliance and customer confidence.'],
            pitfalls: ['Packaging product before lab results return—creates compliance risk if batch fails testing.'],
        },
        '/inventory/stock': {
            steps: [
                'Track finished goods by lot: packaged flower (1g, 3.5g, 7g, 14g, 28g), pre-rolls, concentrates.',
                'Record adjustments for sales, samples, waste/destruction, and inventory corrections.',
                'Monitor aging inventory—flower quality degrades after 6-12 months even when properly stored.',
                'Shared Oxygen maintains 2-4 weeks of finished goods inventory to meet dispensary demand.',
            ],
            outputs: ['Accurate finished goods inventory by lot number for order fulfillment and state reporting.'],
            pitfalls: ['Not tracking lot-level inventory—makes recall response and state audits extremely difficult.'],
        },
        '/sales/orders': {
            steps: [
                'Review dispensary orders and verify inventory availability by lot.',
                'Generate state-compliant manifest with lot numbers, weights, and destination license.',
                'Assign driver and vehicle for delivery; record departure time.',
                'Confirm delivery receipt and close order—dispensary must acknowledge in state system.',
            ],
            outputs: ['Complete order record with manifest, lot assignments, and delivery confirmation for state compliance.'],
            pitfalls: ['Shipping without manifest or with incorrect lot numbers—creates serious compliance violations.'],
        },
        '/sales/customers': {
            steps: [
                'Add licensed dispensaries with their state license number and delivery address.',
                'Record buyer contact, purchasing limits, and payment terms.',
                'Categorize by type: medical dispensary, recreational dispensary, wholesale distributor.',
                'Shared Oxygen customers include: Green Leaf Dispensary, Mountain High Collective, Valley Wellness Center.',
            ],
            outputs: ['A verified customer list with license numbers for compliant order processing.'],
            pitfalls: ['Selling to unlicensed buyers or customers with expired licenses—major compliance violation.'],
        },
        '/traceability/custody': {
            steps: [
                'Record custody events at each handoff: harvest → dry room → cure room → packaging → vault → delivery vehicle → dispensary.',
                'Capture who handled product, when, and any weight changes or adjustments.',
                'Link custody events to lot numbers for complete chain of custody.',
                'At Shared Oxygen, custody events sync with state track-and-trace (Metrc) for regulatory compliance.',
            ],
            outputs: ['Complete chain of custody from plant to sale, defensible for state audits and customer inquiries.'],
            pitfalls: ['Missing custody events create gaps that regulators flag during audits—enter events in real-time.'],
        },
        '/traceability/recalls': {
            steps: [
                'Initiate recall from any identifier: failed lab test (lot GDP-LOT-2024-156), customer complaint, or state notification.',
                'Trace upstream: lot → package date → cure batch → harvest → grow batch → clone source.',
                'Trace downstream: lot → orders → dispensaries → (if needed) consumer notification via dispensary.',
                'Quarantine affected inventory, notify state regulator, document destruction or remediation.',
                'At Shared Oxygen, recall drills are run quarterly to verify traceability links are complete.',
            ],
            outputs: ['Complete recall documentation: scope identification, affected parties, quarantine actions, and regulatory notifications.'],
            pitfalls: ['Incomplete lot tracking makes recall scope unclear—could result in broader recall than necessary or missed affected product.'],
        },

        '/traceability/seed-to-sale': {
            steps: [
                'Verify complete chain: clone/seed source → batch (BD-2024-047) → harvest → dry/cure → package → lot (BD-LOT-2024-312) → order → dispensary.',
                'Spot-check a recent lot and trace backward to clone mother or seed source.',
                'Verify state track-and-trace (Metrc) IDs are linked at each stage for regulatory compliance.',
                'Run this check before state audits, dispensary inquiries, or when onboarding new team members.',
            ],
            outputs: ['Validated seed-to-sale chain that satisfies state compliance requirements and supports customer inquiries.'],
            pitfalls: ['Gaps in the chain (missing Metrc tags, unlinked batches) that create compliance risk during audits.'],
        },

        '/production/environments': {
            steps: [
                'Define grow rooms with consistent naming: Veg Room 1, Veg Room 2, Flower Room 1-4, Dry Room 1-2, Cure Room.',
                'Record room specifications: square footage, light type (LED/HPS), plant capacity, HVAC zone.',
                'Track environmental targets: Veg (75°F, 65% RH, 18/6 light), Flower (68-75°F, 45-55% RH, 12/12 light).',
                'Shared Oxygen rooms: 4 flower rooms (100 plants each), 2 veg rooms (200 clones each), 2 dry rooms, 1 cure room.',
            ],
            outputs: ['A facility map with room capacities and environmental specs for production planning.'],
            pitfalls: ['Inconsistent room naming that causes batch assignment errors and breaks reporting.'],
        },

        '/equipment/environmental': {
            steps: [
                'Track HVAC systems, dehumidifiers, CO2 generators, and environmental controllers by room.',
                'Record sensor calibration dates and replacement schedules for temperature/humidity/CO2 monitors.',
                'Log environmental incidents: HVAC failures, humidity spikes, temperature excursions.',
                'Shared Oxygen equipment: 4 mini-split AC units, 8 commercial dehumidifiers, CO2 burner system, Pulse environmental monitors.',
            ],
            outputs: ['Environmental equipment inventory with maintenance history for root-cause analysis when issues occur.'],
            pitfalls: ['Not tracking sensor calibration—inaccurate readings can ruin entire batches before problems are detected.'],
        },

        '/inventory/packaging': {
            steps: [
                'Track child-resistant containers by size: 1g, 3.5g (eighth), 7g (quarter), 14g (half), 28g (ounce).',
                'Monitor compliance labels: strain name, THC/CBD %, batch/lot number, harvest date, lab test date.',
                'Set reorder points—packaging shortages halt fulfillment even when product is ready.',
                'Shared Oxygen packaging: Calyx containers (CR certified), custom strain labels, tamper-evident seals.',
            ],
            outputs: ['Packaging inventory by size/type with reorder alerts to prevent fulfillment delays.'],
            pitfalls: ['Running out of a specific container size and being unable to fulfill orders for that SKU.'],
        },
        '/tasks': {
            steps: [
                'Use tasks to assign accountability (who, what, when).',
                'Prioritize the daily list and close tasks as soon as work is complete.',
            ],
            outputs: ['A single source of truth for execution and accountability.'],
            pitfalls: ['Leaving tasks open after work is complete—metrics become unreliable.'],
        },
        '/tasks/daily': {
            steps: [
                'Review today\'s tasks and prioritize based on urgency and dependencies.',
                'Mark tasks complete as work finishes to keep the team aligned.',
                'Escalate blocked tasks immediately so they do not stall production.',
            ],
            outputs: ['A clear daily task list that the team can execute.'],
            pitfalls: ['Letting tasks pile up without prioritization or assignment.'],
        },
        '/tasks/assignments': {
            steps: [
                'Assign tasks to specific team members based on skills and availability.',
                'Set due dates and priorities to ensure accountability.',
                'Review assignment balance to avoid overloading individuals.',
            ],
            outputs: ['Balanced workload distribution across the team.'],
            pitfalls: ['Assigning tasks without checking team capacity or skills.'],
        },
        '/tasks/work-orders': {
            steps: [
                'Create work orders for larger jobs that span multiple tasks or days.',
                'Link work orders to batches, equipment, or facilities as needed.',
                'Track work order progress and close when all related tasks are complete.',
            ],
            outputs: ['Organized work orders that group related tasks for complex jobs.'],
            pitfalls: ['Creating work orders without linking them to the relevant production or maintenance context.'],
        },
        '/settings/users': {
            steps: [
                'Invite/create users and verify their farm access.',
                'Assign roles based on responsibility (Owner/Admin/Manager/Team Member).',
                'Review access periodically as teams change.',
            ],
            outputs: ['Correct access control and tenant isolation across farms.'],
            pitfalls: ['Over-provisioning permissions "temporarily" and never reviewing them.'],
        },
        '/settings': {
            steps: [
                'Review available settings categories and navigate to the appropriate section.',
                'Use this as a hub to access users, permissions, notifications, and system configuration.',
            ],
            outputs: ['Quick access to all configuration options.'],
            pitfalls: ['Making changes without understanding their farm-wide impact.'],
        },
        '/settings/permissions': {
            steps: [
                'Review role-based permissions and adjust as needed for your operation.',
                'Ensure sensitive actions (delete, approve, export) are restricted appropriately.',
                'Document any custom permission changes for audit purposes.',
            ],
            outputs: ['A permission structure that matches your operational security requirements.'],
            pitfalls: ['Granting broad permissions without considering compliance implications.'],
        },
        '/settings/notifications': {
            steps: [
                'Configure which events trigger notifications (alerts, reminders, approvals).',
                'Set notification channels (in-app, email) based on urgency.',
                'Test notifications to ensure critical alerts reach the right people.',
            ],
            outputs: ['A notification setup that keeps the team informed without overwhelming them.'],
            pitfalls: ['Enabling too many notifications, causing alert fatigue.'],
        },
        '/settings/backup': {
            steps: [
                'Review backup status and schedule.',
                'Verify that backups are completing successfully.',
                'Test restore procedures periodically to ensure data recovery is possible.',
            ],
            outputs: ['Confidence that data can be recovered if needed.'],
            pitfalls: ['Assuming backups work without ever testing a restore.'],
        },
        '/settings/system': {
            steps: [
                'Review system-wide configuration options.',
                'Adjust settings that affect all users (date formats, units, defaults).',
                'Document changes for team awareness.',
            ],
            outputs: ['Consistent system behavior across all users.'],
            pitfalls: ['Changing system settings without communicating to the team.'],
        },
        '/settings/suppliers': {
            steps: [
                'Add and maintain supplier records for inputs, packaging, and services.',
                'Keep contact information and certifications current.',
                'Link suppliers to inventory items for traceability.',
            ],
            outputs: ['A supplier directory that supports procurement and compliance.'],
            pitfalls: ['Duplicate supplier entries with inconsistent naming.'],
        },
        '/settings/calculator': {
            steps: [
                'Use built-in calculators for yield estimates, dilution ratios, or unit conversions.',
                'Input your parameters and review the calculated results.',
                'Apply results to planning or production decisions.',
            ],
            outputs: ['Quick calculations without leaving OFMS.'],
            pitfalls: ['Relying on calculator results without verifying inputs.'],
        },
        '/analytics': {
            steps: [
                'Navigate to the analytics hub to access various reporting categories.',
                'Select the report type that matches your current question.',
                'Use filters to focus on specific time periods, batches, or products.',
            ],
            outputs: ['Access to operational insights and performance metrics.'],
            pitfalls: ['Looking at analytics without a specific question in mind.'],
        },
        '/analytics/production': {
            steps: [
                'Review production metrics: batch counts, cycle times, and throughput.',
                'Identify trends and anomalies that need attention.',
                'Use insights to adjust planning and resource allocation.',
            ],
            outputs: ['Production performance visibility for continuous improvement.'],
            pitfalls: ['Reviewing metrics without taking action on findings.'],
        },
        '/analytics/yield': {
            steps: [
                'Analyze yield data by strain, environment, and time period.',
                'Compare actual yields to targets and historical averages.',
                'Identify high-performing and underperforming areas.',
            ],
            outputs: ['Yield insights that inform variety selection and process improvements.'],
            pitfalls: ['Comparing yields without accounting for environmental or input differences.'],
        },
        '/analytics/financial': {
            steps: [
                'Review revenue, costs, and margins by product, customer, or time period.',
                'Identify profitable and unprofitable areas of the operation.',
                'Use financial insights to guide pricing and production decisions.',
            ],
            outputs: ['Financial visibility that supports profitability management.'],
            pitfalls: ['Making decisions based on incomplete cost data.'],
        },
        '/analytics/market': {
            steps: [
                'Review market trends, pricing data, and demand signals.',
                'Compare your performance to market benchmarks where available.',
                'Use market insights to inform sales and planning strategies.',
            ],
            outputs: ['Market context for strategic decision-making.'],
            pitfalls: ['Over-reacting to short-term market fluctuations.'],
        },
        '/analytics/sustainability': {
            steps: [
                'Track sustainability metrics: water usage, energy consumption, waste reduction.',
                'Identify opportunities to reduce environmental impact.',
                'Document sustainability progress for certifications and customer inquiries.',
            ],
            outputs: ['Sustainability data that supports certifications and continuous improvement.'],
            pitfalls: ['Collecting sustainability data without setting improvement targets.'],
        },
        '/admin': {
            steps: [
                'Access the admin hub for system-wide management functions.',
                'Navigate to farms, users, or utilities as needed.',
                'Use admin tools responsibly - changes affect all users.',
            ],
            outputs: ['System-wide administrative control.'],
            pitfalls: ['Making admin changes without understanding their scope.'],
        },
        '/admin/farms': {
            steps: [
                'Review all farms (tenants) in the system.',
                'Add new farms or update existing farm details.',
                'Manage farm-level settings and user assignments.',
            ],
            outputs: ['A clean farm directory with accurate details.'],
            pitfalls: ['Creating duplicate farms instead of updating existing ones.'],
        },
        '/admin/farms/[farmId]': {
            steps: [
                'View and edit details for a specific farm.',
                'Review farm users, settings, and activity.',
                'Make changes carefully - they affect all users on this farm.',
            ],
            outputs: ['Updated farm configuration.'],
            pitfalls: ['Editing farm settings without notifying affected users.'],
        },
        '/admin/feedback': {
            steps: [
                'Review user feedback submitted through the application.',
                'Categorize and prioritize feedback for product improvement.',
                'Respond to or acknowledge feedback as appropriate.',
            ],
            outputs: ['Organized feedback that informs product development.'],
            pitfalls: ['Ignoring feedback without review or acknowledgment.'],
        },
        '/admin/utilities/ai-models': {
            steps: [
                'Review AI model configurations and status.',
                'Enable or disable AI features based on operational needs.',
                'Monitor AI model performance and accuracy.',
            ],
            outputs: ['Controlled AI feature deployment.'],
            pitfalls: ['Enabling AI features without understanding their data requirements.'],
        },
        '/admin/utilities/audit-logs': {
            steps: [
                'Search and review audit logs for compliance and investigation purposes.',
                'Filter by user, action type, or time period.',
                'Export logs as needed for auditors or legal requests.',
            ],
            outputs: ['Audit trail visibility for compliance and security.'],
            pitfalls: ['Not reviewing audit logs regularly for anomalies.'],
        },
        '/admin/utilities/connected-users': {
            steps: [
                'View currently connected users and their sessions.',
                'Identify unusual access patterns or unauthorized sessions.',
                'Terminate sessions if security concerns arise.',
            ],
            outputs: ['Real-time visibility into system access.'],
            pitfalls: ['Terminating sessions without warning affected users.'],
        },
        '/admin/utilities/database-management': {
            steps: [
                'Review database health and performance metrics.',
                'Perform maintenance tasks as needed (with caution).',
                'Monitor storage usage and plan for growth.',
            ],
            outputs: ['Database health visibility and maintenance control.'],
            pitfalls: ['Performing database operations without proper backups.'],
        },
        '/admin/utilities/system-health': {
            steps: [
                'Monitor system health indicators: uptime, response times, error rates.',
                'Identify performance issues before they affect users.',
                'Coordinate with IT for infrastructure concerns.',
            ],
            outputs: ['System health visibility for proactive maintenance.'],
            pitfalls: ['Ignoring warning signs until they become critical failures.'],
        },
        '/ai-dashboard': {
            steps: [
                'Review AI-generated insights and recommendations.',
                'Evaluate suggestions in the context of your operation.',
                'Take action on high-confidence recommendations.',
            ],
            outputs: ['AI-powered insights to support decision-making.'],
            pitfalls: ['Blindly following AI recommendations without operational context.'],
        },
        '/ai-insights': {
            steps: [
                'Explore detailed AI analysis for crops, demand, and operations.',
                'Drill into specific insights to understand the underlying data.',
                'Use insights to inform planning and production decisions.',
            ],
            outputs: ['Deep AI analysis for strategic planning.'],
            pitfalls: ['Over-relying on AI without validating against real-world conditions.'],
        },
        '/compliance': {
            steps: [
                'Navigate to the compliance hub for regulatory documentation.',
                'Select the relevant compliance framework (FDA, USDA, etc.).',
                'Review status and identify gaps.',
            ],
            outputs: ['Compliance overview and gap identification.'],
            pitfalls: ['Treating compliance as a one-time task instead of ongoing.'],
        },
        '/compliance/fda-fsma': {
            steps: [
                'Review FDA FSMA compliance requirements and your current status.',
                'Document food safety practices and preventive controls.',
                'Prepare for FDA inspections with organized records.',
            ],
            outputs: ['FDA FSMA compliance documentation and readiness.'],
            pitfalls: ['Waiting until inspection notice to organize compliance records.'],
        },
        '/compliance/usda-organic': {
            steps: [
                'Track USDA Organic certification requirements and documentation.',
                'Maintain input records and organic handling procedures.',
                'Prepare for annual organic certification audits.',
            ],
            outputs: ['USDA Organic compliance documentation and certification readiness.'],
            pitfalls: ['Using non-approved inputs without documenting exceptions.'],
        },
        '/equipment': {
            steps: [
                'Navigate to the equipment hub for asset management.',
                'Select the appropriate category: management, maintenance, sensors, or environmental.',
            ],
            outputs: ['Access to equipment and facility management tools.'],
            pitfalls: ['Neglecting equipment records until something breaks.'],
        },
        '/equipment/management': {
            steps: [
                'Add and maintain equipment records with key details (serial, location, status).',
                'Track equipment lifecycle from acquisition to disposal.',
                'Link equipment to maintenance schedules and production areas.',
            ],
            outputs: ['A complete equipment inventory with lifecycle tracking.'],
            pitfalls: ['Incomplete equipment records that make maintenance planning difficult.'],
        },
        '/equipment/maintenance': {
            steps: [
                'Schedule and track preventive maintenance for all equipment.',
                'Record maintenance activities and outcomes.',
                'Review maintenance history to identify recurring issues.',
            ],
            outputs: ['Maintenance records that support uptime and compliance.'],
            pitfalls: ['Skipping preventive maintenance until equipment fails.'],
        },
        '/equipment/sensors': {
            steps: [
                'Configure and monitor sensors for environmental and equipment data.',
                'Set alert thresholds for critical parameters.',
                'Review sensor data trends to identify issues early.',
            ],
            outputs: ['Real-time sensor monitoring and alerting.'],
            pitfalls: ['Setting alert thresholds too sensitive (alert fatigue) or too loose (missed issues).'],
        },
        '/feedback': {
            steps: [
                'Submit feedback about OFMS features, bugs, or improvement ideas.',
                'Provide enough detail for the team to understand and act on your feedback.',
                'Check back for responses or status updates on your submissions.',
            ],
            outputs: ['Feedback submitted to improve OFMS.'],
            pitfalls: ['Submitting vague feedback that cannot be acted upon.'],
        },
        '/integrations': {
            steps: [
                'Navigate to the integrations hub to connect external systems.',
                'Select the integration category that matches your needs.',
                'Configure connections with proper credentials and settings.',
            ],
            outputs: ['Access to external system integrations.'],
            pitfalls: ['Enabling integrations without understanding data flow and security implications.'],
        },
        '/integrations/accounting': {
            steps: [
                'Connect OFMS to your accounting system for financial data sync.',
                'Map accounts and categories to ensure accurate reporting.',
                'Test the integration with sample transactions before going live.',
            ],
            outputs: ['Accounting integration that reduces manual data entry.'],
            pitfalls: ['Syncing data without verifying account mappings are correct.'],
        },
        '/integrations/ecommerce': {
            steps: [
                'Connect OFMS to your e-commerce platform for order sync.',
                'Configure product mappings and inventory sync settings.',
                'Monitor sync status and resolve any errors promptly.',
            ],
            outputs: ['E-commerce integration that keeps orders and inventory in sync.'],
            pitfalls: ['Overselling due to inventory sync delays.'],
        },
        '/integrations/laboratory': {
            steps: [
                'Connect OFMS to laboratory systems for test result import.',
                'Map test types and result fields to OFMS quality records.',
                'Verify imported results match source data.',
            ],
            outputs: ['Lab integration that automates quality data capture.'],
            pitfalls: ['Accepting lab results without verification or linking to the correct batch.'],
        },
        '/integrations/weather': {
            steps: [
                'Connect OFMS to weather data services for environmental context.',
                'Configure location and alert settings.',
                'Use weather data to inform planning and production decisions.',
            ],
            outputs: ['Weather integration that supports planning and risk management.'],
            pitfalls: ['Ignoring weather alerts that could affect outdoor operations.'],
        },
        '/inventory': {
            steps: [
                'Navigate to the inventory hub for stock management.',
                'Select the appropriate category: stock, supplies, packaging, or equipment.',
            ],
            outputs: ['Access to inventory management tools.'],
            pitfalls: ['Letting inventory records drift from actual counts.'],
        },
        '/inventory/supplies': {
            steps: [
                'Track consumable supplies: nutrients, media, chemicals, and other inputs.',
                'Record usage and receipts to maintain accurate counts.',
                'Set reorder points to prevent stockouts.',
            ],
            outputs: ['Accurate supply inventory that prevents production delays.'],
            pitfalls: ['Running out of critical supplies due to inaccurate tracking.'],
        },
        '/inventory/equipment': {
            steps: [
                'Track equipment inventory: tools, containers, and reusable assets.',
                'Record check-out/check-in for shared equipment.',
                'Maintain condition records for depreciation and replacement planning.',
            ],
            outputs: ['Equipment inventory visibility for planning and accountability.'],
            pitfalls: ['Losing track of equipment location or condition.'],
        },
        '/planning': {
            steps: [
                'Navigate to the planning hub for crop and resource planning.',
                'Select the appropriate workflow: crops, calendar, forecasting, production, or resources.',
            ],
            outputs: ['Access to planning and forecasting tools.'],
            pitfalls: ['Planning in isolation without checking constraints.'],
        },
        '/planning/production': {
            steps: [
                'Plan production runs based on demand forecasts and capacity.',
                'Schedule starts, transfers, and harvests to optimize facility usage.',
                'Coordinate with inventory to ensure inputs are available.',
            ],
            outputs: ['A production plan that balances demand, capacity, and resources.'],
            pitfalls: ['Planning production without checking input availability.'],
        },
        '/production': {
            steps: [
                'Navigate to the production hub for batch and harvest management.',
                'Select the appropriate workflow: batches, harvesting, post-harvest, seeds, or environments.',
            ],
            outputs: ['Access to production management tools.'],
            pitfalls: ['Skipping production data entry and losing traceability.'],
        },
        '/production/batches/[id]': {
            steps: [
                'View and edit details for a specific batch.',
                'Review batch history, events, and linked records.',
                'Update status and add notes as the batch progresses.',
            ],
            outputs: ['Complete batch record with full history.'],
            pitfalls: ['Editing batch records without documenting the reason for changes.'],
        },
        '/quality': {
            steps: [
                'Navigate to the quality hub for checks, audits, and certifications.',
                'Select the appropriate workflow based on your quality task.',
            ],
            outputs: ['Access to quality management tools.'],
            pitfalls: ['Treating quality as a separate activity instead of integrated with production.'],
        },
        '/quality/audits': {
            steps: [
                'Schedule and conduct internal audits to verify compliance.',
                'Document findings, corrective actions, and follow-up.',
                'Use audit results to improve processes before external audits.',
            ],
            outputs: ['Audit records that demonstrate continuous improvement.'],
            pitfalls: ['Conducting audits without follow-through on findings.'],
        },
        '/quality/certifications': {
            steps: [
                'Track certification status, expiration dates, and renewal requirements.',
                'Maintain documentation required for each certification.',
                'Plan renewal activities well before expiration.',
            ],
            outputs: ['Certification tracking that prevents lapses.'],
            pitfalls: ['Letting certifications expire due to missed renewal deadlines.'],
        },
        '/quality/food-safety': {
            steps: [
                'Document food safety practices, HACCP plans, and preventive controls.',
                'Record food safety checks and corrective actions.',
                'Maintain records for regulatory inspections.',
            ],
            outputs: ['Food safety documentation that supports compliance.'],
            pitfalls: ['Incomplete food safety records that create audit risk.'],
        },
        '/quality/organic': {
            steps: [
                'Track organic handling practices and input approvals.',
                'Document any deviations or exceptions.',
                'Maintain organic integrity throughout the supply chain.',
            ],
            outputs: ['Organic compliance records for certification audits.'],
            pitfalls: ['Commingling organic and non-organic product without documentation.'],
        },
        '/sales': {
            steps: [
                'Navigate to the sales hub for customer and order management.',
                'Select the appropriate workflow: customers, orders, pricing, or delivery.',
            ],
            outputs: ['Access to sales management tools.'],
            pitfalls: ['Processing orders without verifying inventory availability.'],
        },
        '/sales/pricing': {
            steps: [
                'Set and maintain product pricing by customer, channel, or volume.',
                'Review pricing regularly against costs and market conditions.',
                'Document pricing changes for audit and analysis.',
            ],
            outputs: ['Pricing structure that supports profitability and customer relationships.'],
            pitfalls: ['Inconsistent pricing that confuses customers or erodes margins.'],
        },
        '/sales/delivery': {
            steps: [
                'Schedule and track deliveries for fulfilled orders.',
                'Confirm delivery completion and capture proof of delivery.',
                'Resolve delivery issues promptly to maintain customer satisfaction.',
            ],
            outputs: ['Delivery records that complete the order-to-cash cycle.'],
            pitfalls: ['Marking orders delivered without confirming actual receipt.'],
        },
        '/traceability': {
            steps: [
                'Navigate to the traceability hub for lot tracking and recall management.',
                'Select the appropriate workflow: lots, custody, recalls, or seed-to-sale.',
            ],
            outputs: ['Access to traceability tools.'],
            pitfalls: ['Treating traceability as optional instead of essential.'],
        },
        '/traceability/lots': {
            steps: [
                'Create and manage lot identifiers for batches and inventory.',
                'Link lots to production events, quality checks, and orders.',
                'Use consistent lot numbering for easy tracing.',
            ],
            outputs: ['Lot records that enable forward and backward tracing.'],
            pitfalls: ['Inconsistent lot numbering that makes tracing difficult.'],
        },
    }

    const first = route.split('/').filter(Boolean)[0] || ''
    const byPrefix: Record<string, RoutePlaybook> = {
        planning: {
            steps: ['Review upcoming work and reconcile it against capacity and demand.', 'Make changes early so execution is smooth.'],
            outputs: ['A plan your team can execute.'],
            pitfalls: ['Planning without closing the loop with inventory, labor, or sales commitments.'],
        },
        production: {
            steps: ['Record production work as it happens: starts, transfers, harvest, and post-harvest steps.'],
            outputs: ['Accurate production records that drive analytics and traceability.'],
            pitfalls: ['Backfilling production records at the end of the week, creating gaps and errors.'],
        },
        quality: {
            steps: ['Capture checks at critical points and document outcomes and corrective actions.'],
            outputs: ['An audit-ready quality trail.'],
            pitfalls: ['Capturing outcomes without evidence, remediation notes, or sign-off.'],
        },
        traceability: {
            steps: ['Ensure lot identifiers and event links are created as product moves.'],
            outputs: ['Fast forward/backward tracing and recall readiness.'],
            pitfalls: ['Missing links between batches, inventory, and orders.'],
        },
    }

    return byRoute[route] || byPrefix[first] || {
        steps: ['Use this page to complete the workflow step it supports.'],
        outputs: ['A consistent record of work completed.'],
        pitfalls: ['Skipping data entry until later and losing important context.'],
    }
}

function listScreenshotFiles(): string[] {
    const roots = ['automation', 'docs', 'public']
    const files = roots.flatMap(r => globSync(`${r}/**/*.png`, { nodir: true }))
    return Array.from(new Set(files))
}

function routeKeywords(route: string): string[] {
    return route
        .split('/')
        .filter(Boolean)
        .filter(s => !s.startsWith('['))
        .flatMap(s => s.split('-'))
        .map(s => s.toLowerCase())
}

function bestScreenshotForRoute(route: string, all: string[]): string | null {
    const keys = routeKeywords(route)
    if (!keys.length) return null

    const scored: ScreenshotCandidate[] = []
    for (const f of all) {
        const name = path.basename(f).toLowerCase()
        let score = 0
        for (const k of keys) {
            if (k.length < 3) continue
            if (name.includes(k)) score += 2
        }
        if (name.includes('debug')) score -= 1
        if (score > 0) scored.push({ filePath: f, score })
    }

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.filePath || null
}

type UiPage = { route: string; file: string; module: string }

type ApiRoute = { route: string; methods: string[] }

type PrismaModel = { name: string; fields: Array<{ name: string; type: string }> }

type PrismaEnum = { name: string; values: string[] }

type PackageScript = { name: string; command: string }

type TenantAuthFacts = {
    sessionCookieName: string | null
    farmHeaderName: string | null
    farmQueryParamName: string | null
}

type CrudFieldDef = {
    name: string
    label: string
    type: string
    required?: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string }>
}

type CrudSectionDef = { title: string; fields: string[] }

type PageFormDef = {
    title: string | null
    fieldsByKey: Record<string, CrudFieldDef[]> // e.g. inventoryFields, adjustmentFields
    sections: CrudSectionDef[] | null
}

type PageGuide = {
    route: string
    file: string
    module: string
    purpose: string
    primaryForms: PageFormDef | null
}

type ScreenshotCandidate = { filePath: string; score: number }

type HeadingLevelValue = (typeof HeadingLevel)[keyof typeof HeadingLevel]
type AlignmentTypeValue = (typeof AlignmentType)[keyof typeof AlignmentType]

function assertFileExists(filePath: string): void {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Required file not found: ${filePath}`)
    }
}

function tryReadFileBuffer(filePath: string): Buffer | null {
    try {
        if (!fs.existsSync(filePath)) return null
        return fs.readFileSync(filePath)
    } catch {
        return null
    }
}

interface LogoData {
    buffer: Buffer
    width: number
    height: number
}

async function loadLogoPngBuffer(opts: { preferredPath?: string; repoRoot: string }): Promise<LogoData | null> {
    const preferred = opts.preferredPath ? path.resolve(opts.preferredPath) : null

    async function processImage(buf: Buffer, filePath: string): Promise<LogoData> {
        const ext = path.extname(filePath).toLowerCase()
        let processedBuf = buf
        if (ext === '.svg') {
            processedBuf = await sharp(buf).png().toBuffer()
        }
        const metadata = await sharp(processedBuf).metadata()
        return {
            buffer: processedBuf,
            width: metadata.width || 400,
            height: metadata.height || 120,
        }
    }

    if (preferred) {
        const buf = tryReadFileBuffer(preferred)
        if (buf) {
            return processImage(buf, preferred)
        }
    }

    const repoSvg = path.join(opts.repoRoot, 'public', 'logo.svg')
    const repoPng = path.join(opts.repoRoot, 'public', 'logo.png')

    const svgBuf = tryReadFileBuffer(repoSvg)
    if (svgBuf) return processImage(svgBuf, repoSvg)

    const pngBuf = tryReadFileBuffer(repoPng)
    if (pngBuf) return processImage(pngBuf, repoPng)

    return null
}

function getRepoRoot(): string {
    return process.cwd()
}

function normalizeRouteFromAppFile(file: string): string {
    const raw = file
        .replace(/^src\/app\//, '')
        .replace(/\/page\.tsx$/, '')
        .replace(/\/+/g, '/')

    const segments = raw
        .split('/')
        .filter(Boolean)
        .filter(seg => !(seg.startsWith('(') && seg.endsWith(')')))

    const route = '/' + segments.join('/')
    return route === '/page' || route === '/app' || route === '/' ? '/' : route
}

function moduleFromRoute(route: string): string {
    const first = route.split('/').filter(Boolean)[0] || 'home'
    const map: Record<string, string> = {
        home: 'Home / Landing',
        dashboard: 'Dashboard',
        planning: 'Planning & Forecasting',
        production: 'Production Operations',
        quality: 'Quality & Compliance',
        compliance: 'Quality & Compliance',
        inventory: 'Inventory Management',
        sales: 'Sales & Orders',
        traceability: 'Traceability & Documentation',
        tasks: 'Task Management',
        equipment: 'Equipment & Facilities',
        analytics: 'Analytics & Reporting',
        'ai-dashboard': 'AI Intelligence',
        'ai-insights': 'AI Intelligence',
        admin: 'System Management / Admin',
        settings: 'Settings',
        feedback: 'Feedback & Support',
        integrations: 'Integrations',
        auth: 'Authentication',
    }

    return map[first] || 'Other'
}

function extractUiPages(): UiPage[] {
    const pageFiles = globSync('src/app/**/page.tsx', { nodir: true })
    const pages: UiPage[] = pageFiles.map(file => {
        const route = normalizeRouteFromAppFile(file)
        return {
            route,
            file,
            module: moduleFromRoute(route),
        }
    })

    // Filter out admin-only pages that require SYSTEM_ADMIN role
    // These are not for regular farm users and cause "site can't be reached" errors
    const excludedRoutes = [
        '/admin/utilities/system-health',
        '/admin/utilities/audit-logs',
        '/admin/utilities/connected-users',
        '/admin/utilities/database-management',
        '/admin/utilities/ai-models',
        '/admin/farms',
        '/admin/feedback',
    ]

    const filteredPages = pages.filter(p =>
        !excludedRoutes.some(excluded => p.route.startsWith(excluded))
    )

    filteredPages.sort((a, b) => a.route.localeCompare(b.route))
    return filteredPages
}

function extractNavItemsFromSidebar(sidebarPath: string): NavItem[] {
    assertFileExists(sidebarPath)
    const content = fs.readFileSync(sidebarPath, 'utf8')

    const items: NavItem[] = []
    const regex = /label:\s*'([^']+)'[\s\S]*?href:\s*'([^']+)'/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
        const label = match[1].trim()
        const href = match[2].trim()
        if (!href.startsWith('/')) continue
        if (!items.some(i => i.label === label && i.href === href)) {
            items.push({ label, href })
        }
    }

    return items
}

function extractApiRoutes(): ApiRoute[] {
    const routeFiles = globSync('src/app/api/**/route.ts', { nodir: true })

    const routes: ApiRoute[] = []

    for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf8')

        const methodsSet = new Set<string>()
        const methodRegex = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g
        let m: RegExpExecArray | null
        while ((m = methodRegex.exec(content)) !== null) {
            methodsSet.add(m[1])
        }

        const route = ('/' + file.replace(/^src\/app\//, '').replace(/\/route\.ts$/, '')).replace(/\/+/g, '/')

        routes.push({ route, methods: Array.from(methodsSet).sort() })
    }

    routes.sort((a, b) => a.route.localeCompare(b.route))
    return routes
}

function parsePrismaSchema(schemaPath: string): { models: PrismaModel[]; enums: PrismaEnum[] } {
    assertFileExists(schemaPath)
    const content = fs.readFileSync(schemaPath, 'utf8')

    const models: PrismaModel[] = []
    const enums: PrismaEnum[] = []

    const modelRegex = /\bmodel\s+(\w+)\s*\{([\s\S]*?)\n\}/g
    let mm: RegExpExecArray | null
    while ((mm = modelRegex.exec(content)) !== null) {
        const name = mm[1]
        const body = mm[2]
        const lines = body.split('\n')
        const fields: Array<{ name: string; type: string }> = []

        for (const raw of lines) {
            const line = raw.trim()
            if (!line) continue
            if (line.startsWith('//')) continue
            if (line.startsWith('@@')) continue

            const parts = line.split(/\s+/)
            if (parts.length < 2) continue

            const fieldName = parts[0]
            const fieldType = parts[1]

            if (fieldName.startsWith('@')) continue
            if (fieldType.startsWith('@')) continue

            fields.push({ name: fieldName, type: fieldType })
            if (fields.length >= 12) break
        }

        models.push({ name, fields })
    }

    const enumRegex = /\benum\s+(\w+)\s*\{([\s\S]*?)\n\}/g
    let em: RegExpExecArray | null
    while ((em = enumRegex.exec(content)) !== null) {
        const name = em[1]
        const body = em[2]
        const values = body
            .split('\n')
            .map(l => l.trim())
            .filter(v => v.length > 0 && !v.startsWith('//') && !v.startsWith('@'))

        enums.push({ name, values })
    }

    models.sort((a, b) => a.name.localeCompare(b.name))
    enums.sort((a, b) => a.name.localeCompare(b.name))

    return { models, enums }
}

function extractPackageScripts(packageJsonPath: string): PackageScript[] {
    assertFileExists(packageJsonPath)
    const raw = fs.readFileSync(packageJsonPath, 'utf8')
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> }
    const scripts = parsed.scripts || {}

    const names = Object.keys(scripts).sort((a, b) => a.localeCompare(b))
    return names.map(name => ({ name, command: scripts[name] }))
}

function extractTenantAuthFacts(requestGuardsPath: string): TenantAuthFacts {
    assertFileExists(requestGuardsPath)
    const content = fs.readFileSync(requestGuardsPath, 'utf8')

    const cookieMatch = content.match(/request\.cookies\.get\('([^']+)'\)/)
    const headerMatch = content.match(/request\.headers\.get\('([^']+)'\)/)
    const queryParamMatch = content.match(/searchParams\.get\('([^']+)'\)/)

    return {
        sessionCookieName: cookieMatch?.[1] || null,
        farmHeaderName: headerMatch?.[1] || null,
        farmQueryParamName: queryParamMatch?.[1] || null,
    }
}

function extractRoles(typesIndexPath: string): { farmRoles: string[]; systemRoles: string[] } {
    assertFileExists(typesIndexPath)
    const content = fs.readFileSync(typesIndexPath, 'utf8')

    function extractUnion(typeName: string): string[] {
        const regex = new RegExp(`export\\s+type\\s+${typeName}\\s*=\\s*([\\s\\S]*?);`)
        const match = content.match(regex)
        if (!match) return []

        const unionBody = match[1]
        const roles = Array.from(unionBody.matchAll(/'([^']+)'/g)).map(m => m[1])
        return Array.from(new Set(roles))
    }

    return {
        farmRoles: extractUnion('FarmRole'),
        systemRoles: extractUnion('SystemRole'),
    }
}

function makeNoBorderTable(rows: TableRow[]): Table {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
        borders: {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
    })
}

function p(text: string, opts?: { bold?: boolean; heading?: HeadingLevelValue; alignment?: AlignmentTypeValue; color?: string }): Paragraph {
    if (opts?.heading) {
        return new Paragraph({
            heading: opts.heading,
            alignment: opts.alignment,
            spacing: { before: 240, after: 140 },
            children: [
                new TextRun({
                    text,
                    bold: opts.bold,
                    color: opts.color,
                }),
            ],
        })
    }

    return new Paragraph({
        alignment: opts?.alignment,
        spacing: { after: 140, line: 276 },
        children: [
            new TextRun({
                text,
                bold: opts?.bold,
                color: opts?.color,
            }),
        ],
    })
}

function para(text: string, opts?: { alignment?: AlignmentTypeValue; color?: string; italics?: boolean; bold?: boolean }): Paragraph {
    return new Paragraph({
        alignment: opts?.alignment,
        spacing: { after: 160, line: 276 },
        children: [
            new TextRun({
                text,
                color: opts?.color,
                italics: opts?.italics,
                bold: opts?.bold,
            }),
        ],
    })
}

function figureCaption(figureNumber: number, title: string): Paragraph {
    return new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 220, line: 276 },
        children: [
            new TextRun({
                text: `Figure ${figureNumber} — ${title}`,
                bold: true,
                color: '555555',
            }),
        ],
    })
}

function figureBlock(image: Buffer, figureNumber: number, title: string): Table {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE' },
                            bottom: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE' },
                            left: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE' },
                            right: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE' },
                        },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 120, after: 80 },
                                children: [
                                    new ImageRun({
                                        data: image,
                                        transformation: {
                                            width: GUIDE_SCREENSHOT_WIDTH,
                                            height: GUIDE_SCREENSHOT_HEIGHT,
                                        },
                                    }),
                                ],
                            }),
                            figureCaption(figureNumber, title),
                        ],
                    }),
                ],
            }),
        ],
    })
}

function heading(text: string, level: HeadingLevelValue): Paragraph {
    const withBorder =
        level === HeadingLevel.HEADING_1 ||
        level === HeadingLevel.HEADING_2 ||
        level === HeadingLevel.HEADING_3 ||
        level === HeadingLevel.HEADING_4 ||
        level === HeadingLevel.HEADING_5
    const border = withBorder
        ? {
            top: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE', space: 6 },
            bottom: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE', space: 6 },
            left: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE', space: 6 },
            right: { style: BorderStyle.SINGLE, size: 8, color: 'D0D7DE', space: 6 },
        }
        : undefined

    return new Paragraph({
        heading: level,
        spacing: { before: 320, after: 160 },
        border,
        children: [
            new TextRun({
                text,
                bold: level !== HeadingLevel.HEADING_1,
            }),
        ],
    })
}

function bullet(text: string, level: number = 0): Paragraph {
    return new Paragraph({
        bullet: { level },
        spacing: { after: 90, line: 276 },
        children: [new TextRun({ text })],
    })
}

function sectionBreak(): Paragraph {
    return new Paragraph({
        spacing: { after: 200 },
        children: [],
    })
}

function fieldTable(fields: CrudFieldDef[]): Table {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ width: { size: 28, type: WidthType.PERCENTAGE }, children: [p('Field', { bold: true })] }),
                    new TableCell({ width: { size: 14, type: WidthType.PERCENTAGE }, children: [p('Required', { bold: true })] }),
                    new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [p('Type', { bold: true })] }),
                    new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [p('How to fill it', { bold: true })] }),
                ],
            }),
            ...fields.map(f => {
                const how =
                    f.placeholder ||
                    (f.options?.length ? `Choose one: ${f.options.slice(0, 6).map(o => o.label).join(', ')}` : 'Enter a value appropriate for your operation.')

                return new TableRow({
                    children: [
                        new TableCell({ children: [para(f.label)] }),
                        new TableCell({ children: [para(f.required ? 'Yes' : 'No', { color: f.required ? '222222' : '555555' })] }),
                        new TableCell({ children: [para(f.type, { color: '555555' })] }),
                        new TableCell({ children: [para(how, { color: '555555' })] }),
                    ],
                })
            }),
        ],
    })
}

function spacer(lines: number = 1): Paragraph {
    return new Paragraph({
        spacing: { after: 120 * Math.max(1, lines) },
        children: [],
    })
}

function groupedByModule(pages: UiPage[]): Array<{ module: string; pages: UiPage[] }> {
    const by = new Map<string, UiPage[]>()
    for (const page of pages) {
        const list = by.get(page.module) || []
        list.push(page)
        by.set(page.module, list)
    }

    return Array.from(by.entries())
        .map(([module, modulePages]) => ({ module, pages: modulePages.sort((a, b) => a.route.localeCompare(b.route)) }))
        .sort((a, b) => a.module.localeCompare(b.module))
}

function simpleBar(n: number, max: number): string {
    if (max <= 0) return ''
    const width = 16
    const count = Math.max(0, Math.min(width, Math.round((n / max) * width)))
    return '█'.repeat(count) + '░'.repeat(width - count)
}

async function loadOfmsHeaderLogoPng(repoRoot: string): Promise<Buffer | null> {
    const svgPath = path.join(repoRoot, 'public', 'logo-icon.svg')
    if (!fs.existsSync(svgPath)) return null

    try {
        const svg = fs.readFileSync(svgPath)
        return await sharp(svg, { density: 300 })
            .resize({ height: 28 })
            .png()
            .toBuffer()
    } catch {
        return null
    }
}

async function buildDoc(params: {
    repoRoot: string
    logoData: LogoData | null
    generatedAt: Date
    outPath: string
}): Promise<Buffer> {
    const headerLogoPng = await loadOfmsHeaderLogoPng(params.repoRoot)
    const headerLogo = headerLogoPng
        ? new ImageRun({
            data: headerLogoPng,
            transformation: { width: 28, height: 28 },
        })
        : null

    const header = new Header({
        children: [
            makeNoBorderTable([
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 45, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.LEFT,
                                    spacing: { before: 0, after: 0 },
                                    children: headerLogo ? [headerLogo] : [new TextRun({ text: 'OFMS', bold: true })],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: { size: 55, type: WidthType.PERCENTAGE },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.RIGHT,
                                    spacing: { before: 0, after: 0 },
                                    children: [
                                        new TextRun({ text: 'Shared Oxygen, LLC', bold: true, color: '555555' }),
                                        new TextRun({ text: '  |  AI & Data Advisory Services', color: '777777' }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ]),
        ],
    })

    const footer = new Footer({
        children: [
            new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                    new TextRun({
                        children: ['Page ', PageNumber.CURRENT],
                        color: '777777',
                    }),
                ],
            }),
        ],
    })

    const sidebarPath = path.join(params.repoRoot, 'src', 'components', 'Layout', 'Sidebar', 'Sidebar.tsx')
    const navItems = extractNavItemsFromSidebar(sidebarPath)

    const uiPages = extractUiPages()
    const uiByModule = groupedByModule(uiPages)
    const pageGuides = buildPageGuides(uiPages)
    const screenshots = listScreenshotFiles()

    const apiRoutes = extractApiRoutes()

    const { models, enums } = parsePrismaSchema(path.join(params.repoRoot, 'prisma', 'schema.prisma'))

    const roles = extractRoles(path.join(params.repoRoot, 'src', 'types', 'index.ts'))

    const scripts = extractPackageScripts(path.join(params.repoRoot, 'package.json'))
    const opsScripts = scripts.filter(s =>
        ['db:', 'docs:', 'test', 'dev', 'build', 'start', 'lint', 'type-check', 'quality:'].some(prefix => s.name.startsWith(prefix))
    )

    const tenantAuthFacts = extractTenantAuthFacts(path.join(params.repoRoot, 'src', 'lib', 'middleware', 'requestGuards.ts'))

    // Calculate cover logo dimensions maintaining aspect ratio, max width 400px
    const coverLogo = params.logoData
        ? (() => {
            const maxWidth = 400
            const aspectRatio = params.logoData.width / params.logoData.height
            const displayWidth = Math.min(maxWidth, params.logoData.width)
            const displayHeight = Math.round(displayWidth / aspectRatio)
            return new ImageRun({
                data: params.logoData.buffer,
                transformation: { width: displayWidth, height: displayHeight },
            })
        })()
        : null

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: 'Calibri',
                        size: 22,
                        color: '222222',
                    },
                    paragraph: {
                        spacing: { after: 140, line: 276 },
                    },
                },
            },
        },
        sections: [
            {
                properties: {
                    titlePage: true,
                    page: {
                        margin: {
                            top: convertInchesToTwip(1),
                            right: convertInchesToTwip(1),
                            bottom: convertInchesToTwip(1),
                            left: convertInchesToTwip(1),
                        },
                    },
                },
                headers: {
                    default: header,
                },
                footers: {
                    default: footer,
                },
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: coverLogo ? [coverLogo] : [new TextRun({ text: 'OFMS', bold: true })],
                    }),
                    spacer(1),
                    p('OFMS User Guide', { heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
                    para('A practical, story-driven guide to running daily operations with OFMS. Suitable for onboarding teams and sharing with prospective buyers.', {
                        alignment: AlignmentType.CENTER,
                        color: '555555',
                    }),
                    para(`Generated: ${params.generatedAt.toISOString()}`, { alignment: AlignmentType.CENTER, color: '777777' }),
                    spacer(1),
                    p('Shared Oxygen, LLC', { alignment: AlignmentType.CENTER, bold: true }),
                    para('AI & Data Advisory Services', { alignment: AlignmentType.CENTER, color: '555555' }),
                ],
            },
            {
                headers: {
                    default: header,
                },
                footers: {
                    default: footer,
                },
                children: [
                    heading('Table of Contents', HeadingLevel.HEADING_1),
                    // Static TOC for Pages compatibility
                    para('Part I: The Cultivation Journey', { bold: true }),
                    bullet('Day 1: Getting Started — Setting Up Your Farm'),
                    bullet('Week 1: Propagation — From Clone to Seedling'),
                    bullet('Weeks 2-5: Vegetative Growth — Building the Foundation'),
                    bullet('Weeks 6-14: Flowering — The Main Event'),
                    bullet('Harvest Day: Cutting, Trimming, and Weighing'),
                    bullet('Post-Harvest: Drying, Curing, and Packaging'),
                    bullet('Sale & Fulfillment: From Vault to Dispensary'),
                    spacer(1),
                    para('Part II: OFMS Features & AI Intelligence', { bold: true }),
                    bullet('Dashboard & Daily Operations'),
                    bullet('Production Tracking & Batch Management'),
                    bullet('Quality Control & Compliance'),
                    bullet('Inventory & Sales'),
                    bullet('AI-Powered Insights & Predictions'),
                    bullet('Traceability & Recall Management'),
                    spacer(1),
                    para('Part III: Technical Reference', { bold: true }),
                    bullet('System Configuration'),
                    bullet('User Roles & Permissions'),
                    bullet('API & Integrations'),
                    sectionBreak(),

                    heading('Executive Summary', HeadingLevel.HEADING_1),
                    para(
                        'The Organic Farmer Management System (OFMS) represents a paradigm shift in agricultural operations management. Purpose-built for licensed cultivation facilities, OFMS unifies planning, production tracking, quality assurance, inventory control, and regulatory compliance into a single, intuitive platform. By eliminating fragmented spreadsheets and disconnected systems, OFMS enables cultivation teams to focus on what matters most: producing exceptional product while maintaining impeccable compliance records.'
                    ),
                    para(
                        'This comprehensive guide demonstrates OFMS capabilities through the lens of Shared Oxygen Farms, a licensed cannabis cultivation facility. Every workflow, screenshot, and example reflects real-world operational scenarios that cultivation managers encounter daily.',
                        { color: '555555' }
                    ),
                    heading('Strategic Value Proposition', HeadingLevel.HEADING_2),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [p('Outcome', { bold: true })] }),
                                    new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [p('How OFMS supports it', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Operational Excellence')] }),
                                    new TableCell({
                                        children: [
                                            para(
                                                'Integrated workflow modules seamlessly connect planning, production, quality, inventory, and fulfillment—eliminating manual handoffs and reducing operational friction by up to 40%.'
                                            ),
                                        ],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Regulatory Confidence')] }),
                                    new TableCell({
                                        children: [
                                            para(
                                                'Comprehensive audit trails, automated quality documentation, and real-time compliance monitoring ensure your facility is inspection-ready at all times.'
                                            ),
                                        ],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Recall Preparedness')] }),
                                    new TableCell({
                                        children: [
                                            para(
                                                'End-to-end traceability from seed to sale enables rapid lot identification, scope determination, and stakeholder notification—reducing recall response time from days to hours.'
                                            ),
                                        ],
                                    }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Enterprise Scalability')] }),
                                    new TableCell({
                                        children: [
                                            para(
                                                'Multi-tenant architecture with robust data isolation supports single-facility operations and multi-site enterprises with consistent security and reporting standards.'
                                            ),
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    heading('Competitive Differentiation', HeadingLevel.HEADING_2),
                    bullet('Operator-Centric Design: Every interface mirrors the natural workflow of cultivation teams, minimizing training time and maximizing adoption.'),
                    bullet('Compliance-Native Architecture: Regulatory requirements are embedded into daily operations—not bolted on as afterthoughts—ensuring continuous compliance without additional effort.'),
                    bullet('Unified Planning & Execution: Demand forecasts, production calendars, and resource constraints integrate seamlessly, preventing capacity conflicts and missed deadlines.'),
                    bullet('Living Documentation: Auto-generated guides and screenshots ensure training materials remain synchronized with system updates.'),
                    bullet('AI-Powered Intelligence: Optional machine learning modules surface actionable insights for yield optimization, demand forecasting, and operational efficiency.'),
                    heading('Industry Landscape', HeadingLevel.HEADING_2),
                    para(
                        'OFMS occupies a unique position at the intersection of three established software categories: farm management suites (production planning and inventory), food safety traceability systems (audit-ready documentation), and regulated track-and-trace platforms (state compliance reporting). By consolidating these capabilities into a unified platform, OFMS eliminates the integration complexity and data silos that plague multi-vendor approaches.',
                        { color: '555555' }
                    ),
                    heading('Reference Platforms', HeadingLevel.HEADING_3),
                    bullet('Farm Management: Farmbrite (https://www.farmbrite.com/)'),
                    bullet('Production Traceability: Croptracker (https://www.croptracker.com/)'),
                    bullet('Regulatory Compliance: Metrc (https://www.metrc.com/)'),
                    sectionBreak(),

                    heading('PART I — THE CULTIVATION JOURNEY', HeadingLevel.HEADING_1),
                    para(
                        'Follow along as we track a Blue Dream batch at Shared Oxygen Farms from Day 1 through harvest and sale. This narrative demonstrates how OFMS supports every stage of cannabis cultivation with real-time tracking, AI-powered insights, and complete seed-to-sale traceability.',
                        { color: '555555' }
                    ),

                    heading('Day 1: Getting Started', HeadingLevel.HEADING_2),
                    para(
                        'Maria, the Cultivation Manager at Shared Oxygen Farms, logs into OFMS to begin a new production cycle. Today she will take 60 Blue Dream clones from the mother room and start batch SO-BD-2025-001.'
                    ),
                    heading('Setting Up the Farm', HeadingLevel.HEADING_3),
                    para('Before any cultivation begins, Maria configured Shared Oxygen Farms in OFMS:'),
                    bullet('Farm Profile: 5,000 sq ft licensed indoor facility in California (License: BCC-LIC-DEMO-0001)'),
                    bullet('Strain Catalog: Blue Dream, OG Kush, Girl Scout Cookies, Sour Diesel, Granddaddy Purple'),
                    bullet('Grow Rooms: Clone Room, 2 Veg Rooms, 2 Flower Rooms, Drying Room, Curing Vault'),
                    bullet('Team: 3 cultivators, 1 quality lead, 1 packaging specialist'),
                    heading('Creating the Batch', HeadingLevel.HEADING_3),
                    para('In Production → Batches, Maria creates batch SO-BD-2025-001:'),
                    bullet('Strain: Blue Dream (Cannabis sativa-dominant hybrid, 17-24% THC)'),
                    bullet('Quantity: 60 clones from mother plant BD-M-003'),
                    bullet('Location: Clone & Propagation Room'),
                    bullet('Growing Medium: Rockwool cubes in humidity domes'),
                    bullet('Target Harvest: 107 days (March 15, 2025)'),
                    para('AI Insight: "Based on historical data, Blue Dream batches started in January achieve 8% higher yields due to optimal humidity conditions. Recommended: maintain 75% RH for first 14 days."', { color: '2E7D32' }),

                    heading('Week 1: Propagation', HeadingLevel.HEADING_2),
                    para(
                        'The clones spend their first week developing roots under 18 hours of light. Maria checks on them daily, recording observations in OFMS.'
                    ),
                    heading('Daily Monitoring', HeadingLevel.HEADING_3),
                    bullet('Day 3: 58/60 clones showing root nubs. 2 removed (96.7% success rate).'),
                    bullet('Day 5: Roots visible through rockwool. Humidity reduced to 70%.'),
                    bullet('Day 7: Ready for transplant. Average root length: 2 inches.'),
                    heading('Quality Check', HeadingLevel.HEADING_3),
                    para('Maria records a quality check in Quality → Control:'),
                    bullet('Check Type: Visual Inspection'),
                    bullet('Result: PASS — Healthy white roots, no signs of rot or pests'),
                    bullet('Notes: Clone vigor excellent. Mother plant health score: 94/100'),
                    para('AI Insight: "Clone success rate 96.7% exceeds 95% target. Recommend taking next clone batch in 14 days to maintain production schedule."', { color: '2E7D32' }),

                    heading('Weeks 2-5: Vegetative Growth', HeadingLevel.HEADING_2),
                    para(
                        'After transplanting to 1-gallon pots, the plants move to Vegetative Room 1. This is where they build the structure that will support heavy flower production.'
                    ),
                    heading('Environment Settings', HeadingLevel.HEADING_3),
                    para('Maria configures the veg room in Production → Environments:'),
                    bullet('Temperature: 75-82°F (currently 78°F)'),
                    bullet('Humidity: 50-60% (currently 55%)'),
                    bullet('Light Schedule: 18 hours on / 6 hours off'),
                    bullet('CO2: 1,200 ppm'),
                    bullet('pH: 6.0'),
                    heading('Training & Topping', HeadingLevel.HEADING_3),
                    bullet('Day 14: First topping performed. Plants now have 2 main colas each.'),
                    bullet('Day 21: Second topping. Plants now have 8 main colas each.'),
                    bullet('Day 28: SCROG net installed. Canopy filling nicely.'),
                    para('Task Management: Maria assigns daily tasks to her team via Tasks → Daily:'),
                    bullet('6:00 AM: Environmental check (temp, humidity, CO2)'),
                    bullet('8:00 AM: Feeding — Advanced Nutrients Grow A+B, B-52, Voodoo Juice'),
                    bullet('2:00 PM: Plant inspection and training'),
                    bullet('6:00 PM: Lights-off check'),
                    para('AI Insight: "Plant structure optimal for SCROG setup. Canopy at 82% coverage. Recommend 3 more days of veg to reach 85% before flip. Projected yield: 450g/plant."', { color: '2E7D32' }),

                    heading('Weeks 6-14: Flowering', HeadingLevel.HEADING_2),
                    para(
                        'On Day 35, Maria "flips" the batch to flowering by changing the light schedule to 12/12. The plants are moved to Flower Room 1, where they will spend the next 9 weeks developing dense, trichome-covered buds.'
                    ),
                    heading('The Flip', HeadingLevel.HEADING_3),
                    para('In Production → Batches, Maria updates the batch status:'),
                    bullet('Status: VEGETATIVE → FLOWERING'),
                    bullet('Location: Vegetative Room 1 → Flower Room 1 (Main)'),
                    bullet('Light Schedule: 18/6 → 12/12'),
                    bullet('Nutrients: Switched to Advanced Nutrients Bloom A+B, Big Bud'),
                    heading('Flower Development Timeline', HeadingLevel.HEADING_3),
                    bullet('Week 1-2 (Stretch): Plants double in height. Defoliation performed Day 42.'),
                    bullet('Week 3-4: Bud sites forming. 127 visible bud sites across batch.'),
                    bullet('Week 5-6: Buds swelling. Trichomes developing. Humidity lowered to 45%.'),
                    bullet('Week 7-8: Dense colas forming. Aroma intensifying. Support stakes added.'),
                    bullet('Week 9: Trichomes 70% cloudy, 20% clear, 10% amber. Harvest window approaching.'),
                    para('AI Insight: "Optimal harvest window predicted for Days 90-92. Current trichome development suggests peak THC at Day 91. Recommend increasing dark period to 14 hours for final 48 hours before harvest."', { color: '2E7D32' }),

                    heading('Harvest Day', HeadingLevel.HEADING_2),
                    para(
                        'Day 91. The trichomes are perfect — mostly cloudy with a hint of amber. Maria and her team begin the harvest of batch SO-BD-2025-001.'
                    ),
                    heading('Harvest Process', HeadingLevel.HEADING_3),
                    bullet('5:00 AM: Final dark period ends. Plants cut at base.'),
                    bullet('6:00 AM: Wet trim begins. Large fan leaves removed.'),
                    bullet('12:00 PM: All 58 plants processed. Wet weight: 21.6 kg (47.6 lbs).'),
                    bullet('1:00 PM: Plants hung in Drying Room. Temp: 62°F, Humidity: 55%.'),
                    heading('Recording the Harvest', HeadingLevel.HEADING_3),
                    para('In Production → Harvesting, Maria records:'),
                    bullet('Harvest Date: Day 91 of cycle'),
                    bullet('Wet Weight: 21.6 kg'),
                    bullet('Plant Count: 58 (2 culled during propagation)'),
                    bullet('Quality Grade: A (dense buds, excellent trichome coverage)'),
                    bullet('Samples Sent: 3 samples to Statewide Testing Lab for COA'),
                    para('AI Insight: "Harvest yield 21.6 kg wet weight, 8% above prediction. Environmental conditions logged for replication in future Blue Dream batches."', { color: '2E7D32' }),

                    heading('Post-Harvest: Drying & Curing', HeadingLevel.HEADING_2),
                    para(
                        'The harvested plants hang in the Drying Room for 10 days, then move to the Curing Vault for 21 days of slow curing to develop flavor and potency.'
                    ),
                    heading('Drying (Days 92-101)', HeadingLevel.HEADING_3),
                    bullet('Environment: 60-65°F, 50-60% RH, complete darkness'),
                    bullet('Daily checks: Stem snap test, moisture readings'),
                    bullet('Day 101: Stems snap cleanly. Ready for trim and cure.'),
                    bullet('Dry Weight: 4.8 kg (10.6 lbs) — 22% of wet weight'),
                    heading('Curing (Days 102-122)', HeadingLevel.HEADING_3),
                    para('In Production → Post-Harvest, Maria tracks the cure:'),
                    bullet('Storage: Grove bags in Curing Vault'),
                    bullet('Environment: 62-68°F, 58-65% RH'),
                    bullet('Burping Schedule: Daily for first week, then every 3 days'),
                    bullet('Day 115: COA received — 21.8% THC, 0.2% CBD, all pesticide tests PASS'),
                    bullet('Day 122: Cure complete. Final weight: 4.6 kg (10.1 lbs)'),
                    para('AI Insight: "Final yield 4.6 kg, 350g/plant average. Terpene preservation estimated at 94%. This batch qualifies for premium pricing tier."', { color: '2E7D32' }),

                    heading('Sale & Fulfillment', HeadingLevel.HEADING_2),
                    para(
                        'With the cure complete and COA in hand, Maria packages the flower and fulfills orders from dispensary customers.'
                    ),
                    heading('Packaging', HeadingLevel.HEADING_3),
                    para('In Inventory → Packaging, the team creates retail units:'),
                    bullet('Product: Blue Dream Premium Flower'),
                    bullet('Package Size: 1/8 oz (3.5g) glass jars'),
                    bullet('Units Created: 1,314 jars'),
                    bullet('Lot Numbers: SO-BD-2025-001-LOT-001 through LOT-1314'),
                    bullet('Compliance Tags: Applied from state portal'),
                    heading('Order Fulfillment', HeadingLevel.HEADING_3),
                    para('In Sales → Orders, Maria processes the first order:'),
                    bullet('Customer: North Bay Dispensary'),
                    bullet('Order: 500 units (1.75 kg) @ $45/unit = $22,500'),
                    bullet('Manifest Generated: State-compliant transport manifest'),
                    bullet('Delivery: Climate-controlled vehicle with GPS tracking'),
                    heading('Traceability Verification', HeadingLevel.HEADING_3),
                    para('In Traceability → Seed-to-Sale, Maria verifies the complete chain:'),
                    bullet('Lot SO-BD-2025-001-LOT-001 → Batch SO-BD-2025-001 → Harvest Day 91 → Flower Room 1 → Clone from Mother BD-M-003'),
                    para('AI Insight: "Order fulfillment complete. Revenue this batch: $59,130. Profit margin: 68%. Recommend increasing Blue Dream production by 15% for Q2."', { color: '2E7D32' }),

                    heading('Continuous Improvement: The Feedback System', HeadingLevel.HEADING_2),
                    para(
                        'Throughout the cultivation journey, Maria and her team use the OFMS Feedback System to share observations, suggest improvements, and report issues. This built-in communication channel ensures that operational insights flow directly to decision-makers and system administrators.'
                    ),
                    heading('Purpose of the Feedback System', HeadingLevel.HEADING_3),
                    para('The Feedback System serves three critical functions:'),
                    bullet('Operational Improvement: Team members can suggest workflow enhancements, report equipment issues, or flag process bottlenecks directly from any OFMS screen.'),
                    bullet('Quality Assurance: Cultivators can document observations that may not fit standard quality check forms—unusual plant behavior, environmental anomalies, or supplier concerns.'),
                    bullet('System Enhancement: Users can request new features, report bugs, or suggest UI improvements, creating a direct channel between operators and the development team.'),
                    heading('How Maria Uses Feedback', HeadingLevel.HEADING_3),
                    para('After completing the Blue Dream harvest, Maria submits feedback:'),
                    bullet('Category: Process Improvement'),
                    bullet('Subject: "Harvest Day Workflow Optimization"'),
                    bullet('Message: "Suggest adding a pre-harvest checklist that auto-generates based on batch size. For 50+ plant harvests, we need to schedule extra trim staff 48 hours in advance."'),
                    bullet('Priority: Medium'),
                    para('The feedback is routed to the Operations Manager and logged for the next process review meeting.'),
                    heading('Feedback Categories', HeadingLevel.HEADING_3),
                    bullet('Bug Report: Technical issues, errors, or unexpected system behavior'),
                    bullet('Feature Request: New functionality or capability suggestions'),
                    bullet('Process Improvement: Workflow optimizations and operational enhancements'),
                    bullet('General Feedback: Observations, compliments, or general comments'),
                    para('AI Insight: "Feedback analysis shows 73% of suggestions relate to harvest and post-harvest workflows. Recommend prioritizing automation features for these stages in the next release."', { color: '2E7D32' }),
                    sectionBreak(),

                    heading('PART II — OFMS FEATURES & AI INTELLIGENCE', HeadingLevel.HEADING_1),
                    para(
                        'Now that you have seen the cultivation journey, let us explore each OFMS module in detail. The following sections provide comprehensive guidance for every feature.'
                    ),

                    ...(() => {
                        let figureNumber = 1

                        return uiByModule.flatMap(mod => {
                            const modulePages = pageGuides.filter(g => g.module === mod.module)

                            const moduleIntro =
                                mod.module === 'Dashboard'
                                    ? 'Your daily command center for KPIs, quick actions, and alerts. At Shared Oxygen, the dashboard shows active batches by growth stage, plants ready for harvest, pending dispensary orders, and environmental alerts from grow rooms.'
                                    : mod.module === 'Planning & Forecasting'
                                        ? 'Plan what strains to grow, when to start new batches, and how to allocate grow room capacity. Shared Oxygen uses this module to balance dispensary demand forecasts against available flowering space.'
                                        : mod.module === 'Production Operations'
                                            ? 'Track cannabis batches from clone/seed through vegetative growth, flowering, harvest, and post-harvest processing. Each batch at Shared Oxygen follows the lifecycle: Clone → Veg → Flower → Harvest → Dry → Cure → Package.'
                                            : mod.module === 'Quality & Compliance'
                                                ? 'Record quality checks, lab test results (COAs), and maintain audit-ready documentation for state regulators. Shared Oxygen captures pre-harvest inspections, potency testing, and pesticide/contaminant screening.'
                                                : mod.module === 'Inventory Management'
                                                    ? 'Keep inputs (nutrients, grow media, packaging) and finished goods (packaged flower, concentrates) accurate. Shared Oxygen tracks inventory by lot for state compliance and recall readiness.'
                                                    : mod.module === 'Sales & Orders'
                                                        ? 'Manage dispensary orders and wholesale fulfillment. Shared Oxygen processes orders from licensed dispensaries, generates manifests, and tracks delivery confirmations.'
                                                        : mod.module === 'Traceability & Documentation'
                                                            ? 'Ensure seed-to-sale traceability required by state regulations. Shared Oxygen links every packaged product back through harvest, batch, grow room, and clone source for complete chain of custody.'
                                                            : mod.module === 'Task Management'
                                                                ? 'Assign and track daily cultivation tasks: feeding schedules, environmental checks, harvest prep, and packaging runs. Shared Oxygen uses tasks to coordinate the grow team across multiple rooms.'
                                                                : mod.module === 'Equipment & Facilities'
                                                                    ? 'Manage grow room equipment: HVAC systems, lighting, irrigation, and environmental sensors. Shared Oxygen tracks maintenance schedules to prevent equipment failures during critical growth stages.'
                                                                    : mod.module === 'Analytics & Reporting'
                                                                        ? 'Analyze yield performance, strain profitability, and operational efficiency. Shared Oxygen reviews analytics to optimize strain selection and grow room utilization.'
                                                                        : mod.module === 'AI Intelligence'
                                                                            ? 'AI-powered insights for crop optimization and demand forecasting. When enabled, OFMS can suggest optimal harvest timing and predict dispensary demand patterns.'
                                                                            : mod.module === 'Settings'
                                                                                ? 'Configure users, permissions, notifications, and system preferences. Shared Oxygen manages team access and notification rules for compliance alerts.'
                                                                                : mod.module === 'Integrations'
                                                                                    ? 'Connect OFMS to external systems: state track-and-trace (Metrc), lab testing portals, and accounting software.'
                                                                                    : mod.module === 'System Management / Admin'
                                                                                        ? 'System administration for multi-tenant operations, audit logs, and database management. Reserved for OFMS administrators.'
                                                                                        : 'Use this module to complete the workflow step it supports.'

                            const contentBlocks: Array<Paragraph | Table> = [
                                heading(mod.module, HeadingLevel.HEADING_2),
                                para(moduleIntro, { color: '555555' }),
                            ]

                            for (const pg of modulePages) {
                                contentBlocks.push(heading(`${titleFromRoute(pg.route)} (${pg.route})`, HeadingLevel.HEADING_3))
                                contentBlocks.push(para(pg.purpose))

                                const screenshotPath = bestScreenshotForRoute(pg.route, screenshots)
                                if (screenshotPath) {
                                    const abs = path.join(params.repoRoot, screenshotPath)
                                    const buf = tryReadFileBuffer(abs)
                                    if (buf) {
                                        contentBlocks.push(figureBlock(buf, figureNumber++, titleFromRoute(pg.route)))
                                    }
                                }

                                const playbook = routePlaybook(pg.route)

                                contentBlocks.push(heading('Operational Workflow', HeadingLevel.HEADING_4))
                                for (const s of playbook.steps) contentBlocks.push(bullet(s))

                                contentBlocks.push(heading('Expected Outcomes', HeadingLevel.HEADING_4))
                                for (const o of playbook.outputs) contentBlocks.push(bullet(o))

                                contentBlocks.push(heading('Risk Mitigation', HeadingLevel.HEADING_4))
                                for (const pit of playbook.pitfalls) contentBlocks.push(bullet(pit))

                                if (pg.primaryForms && Object.keys(pg.primaryForms.fieldsByKey).length) {
                                    contentBlocks.push(heading('Data Entry Requirements', HeadingLevel.HEADING_4))
                                    if (pg.primaryForms.sections?.length) {
                                        contentBlocks.push(
                                            para(
                                                `This page organizes data entry into sections: ${pg.primaryForms.sections
                                                    .map(s => s.title)
                                                    .join(', ')}.`,
                                                { color: '555555' }
                                            )
                                        )
                                    }

                                    const keys = Object.keys(pg.primaryForms.fieldsByKey).sort((a, b) => a.localeCompare(b))
                                    for (const key of keys) {
                                        const fields = pg.primaryForms.fieldsByKey[key]
                                        contentBlocks.push(heading(`Field set: ${key}`, HeadingLevel.HEADING_5))
                                        contentBlocks.push(fieldTable(fields))
                                    }
                                }

                                contentBlocks.push(para(''))
                            }

                            contentBlocks.push(sectionBreak())
                            return contentBlocks
                        })
                    })(),

                    heading('PART II — TECHNICAL OPERATIONS (Admin/IT)', HeadingLevel.HEADING_1),
                    para(
                        'This section is for system operators and administrators. It is intentionally placed at the back to keep the front section buyer- and user-oriented.'
                    ),
                    heading('Roles & access', HeadingLevel.HEADING_2),
                    para('Farm Roles:', { color: '555555' }),
                    para(roles.farmRoles.join(', '), { color: '555555' }),
                    para('System Roles:', { color: '555555' }),
                    para(roles.systemRoles.join(', '), { color: '555555' }),
                    heading('Tenant isolation & request context', HeadingLevel.HEADING_2),
                    para(
                        `OFMS uses a farm-scoped request model. Most requests include a farm identifier header and are authorized against farm membership.`,
                        { color: '555555' }
                    ),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [p('Item', { bold: true })] }),
                                    new TableCell({ children: [p('Value', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Session cookie name')] }),
                                    new TableCell({ children: [para(tenantAuthFacts.sessionCookieName || '—')] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Farm header name')] }),
                                    new TableCell({ children: [para(tenantAuthFacts.farmHeaderName || '—')] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Dev farm query param fallback')] }),
                                    new TableCell({ children: [para(tenantAuthFacts.farmQueryParamName || '—')] }),
                                ],
                            }),
                        ],
                    }),
                    heading('System Administration', HeadingLevel.HEADING_2),
                    para('Key administrative tasks for OFMS system operators:', { color: '555555' }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [p('Task', { bold: true })] }),
                                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [p('Description', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('User Management')] }),
                                    new TableCell({ children: [para('Add, modify, or deactivate user accounts via Settings → Users. Assign appropriate roles (FARM_OWNER, MANAGER, WORKER, VIEWER) based on job responsibilities.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Farm Configuration')] }),
                                    new TableCell({ children: [para('Configure farm settings, grow zones, and environmental parameters via Settings → Farm Profile. Update license information and compliance certifications as needed.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Data Backup')] }),
                                    new TableCell({ children: [para('OFMS automatically backs up data daily. For manual exports, use Analytics → Reports → Export Data. Retain backups per your data retention policy (recommended: 7 years for compliance).', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Audit Trail Review')] }),
                                    new TableCell({ children: [para('Review system activity via Settings → Audit Log. All user actions, data changes, and system events are logged with timestamps for compliance and troubleshooting.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Integration Management')] }),
                                    new TableCell({ children: [para('Configure third-party integrations (Metrc, payment processors, lab systems) via Settings → Integrations. Test connections after any credential changes.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('System Health Monitoring')] }),
                                    new TableCell({ children: [para('Monitor system status via the Dashboard health indicators. Contact support if you observe persistent errors, slow performance, or data sync issues.', { color: '555555' })] }),
                                ],
                            }),
                        ],
                    }),

                    heading('Support & Escalation', HeadingLevel.HEADING_2),
                    para('For technical assistance or system issues:', { color: '555555' }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [p('Issue Type', { bold: true })] }),
                                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [p('Action', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('General Questions')] }),
                                    new TableCell({ children: [para('Use the in-app Help (? icon) or submit feedback via My Feedback. Response within 24 hours.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Data Discrepancies')] }),
                                    new TableCell({ children: [para('Document the issue with screenshots, batch/lot numbers, and expected vs. actual values. Submit via My Feedback with "Data Issue" category.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Compliance Urgency')] }),
                                    new TableCell({ children: [para('For issues affecting regulatory compliance or state reporting, escalate immediately to your OFMS account manager or call the priority support line.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('System Outage')] }),
                                    new TableCell({ children: [para('Check status.sharedoxygen.com for known issues. If not listed, contact emergency support. Document any manual records needed during downtime.', { color: '555555' })] }),
                                ],
                            }),
                        ],
                    }),

                    heading('Integration Capabilities', HeadingLevel.HEADING_2),
                    para('OFMS provides secure API access for authorized integrations. Contact your account manager for credentials and technical documentation.', { color: '555555' }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [p('Integration', { bold: true })] }),
                                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [p('Capability', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('State Track-and-Trace')] }),
                                    new TableCell({ children: [para('Bi-directional sync with Metrc, BioTrack, or state-specific systems. Automatic manifest generation and tag reconciliation.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Laboratory Systems')] }),
                                    new TableCell({ children: [para('Receive COA results directly from certified labs. Auto-populate potency, terpene, and compliance test results.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Point of Sale')] }),
                                    new TableCell({ children: [para('Real-time inventory sync with dispensary POS systems. Order status updates and fulfillment tracking.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Environmental Sensors')] }),
                                    new TableCell({ children: [para('Ingest data from IoT sensors (temperature, humidity, CO2, light). Automated alerts when readings exceed thresholds.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Accounting Systems')] }),
                                    new TableCell({ children: [para('Export financial data to QuickBooks, Xero, or custom ERP. Revenue, COGS, and inventory valuation reports.', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Custom Integrations')] }),
                                    new TableCell({ children: [para('RESTful API with ' + apiRoutes.length + ' endpoints. OAuth 2.0 authentication. Webhook support for real-time events.', { color: '555555' })] }),
                                ],
                            }),
                        ],
                    }),

                    heading('Document Information', HeadingLevel.HEADING_2),
                    para('This user guide was generated from the OFMS application codebase to ensure accuracy with the current system version.', { color: '555555' }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [p('Item', { bold: true })] }),
                                    new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [p('Value', { bold: true })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Generated')] }),
                                    new TableCell({ children: [para(params.generatedAt.toLocaleString(), { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('OFMS Version')] }),
                                    new TableCell({ children: [para('1.0.0', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Data Models')] }),
                                    new TableCell({ children: [para(models.length + ' entities', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('API Endpoints')] }),
                                    new TableCell({ children: [para(apiRoutes.length + ' routes', { color: '555555' })] }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [para('Contact')] }),
                                    new TableCell({ children: [para('support@sharedoxygen.com', { color: '555555' })] }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    })

    return Packer.toBuffer(doc)
}

async function main(): Promise<void> {
    program
        .option('--out <path>', 'Output docx path', path.join('docs', 'OFMS_User_Guide.docx'))
        .option('--logo <path>', 'Logo path (png/jpg/svg). If omitted, repo branding is used when available.')

    program.parse(process.argv)
    const options = program.opts<{ out: string; logo?: string }>()

    const repoRoot = getRepoRoot()
    const outPath = path.resolve(options.out)

    const logoData = await loadLogoPngBuffer({ preferredPath: options.logo, repoRoot })

    const buf = await buildDoc({ repoRoot, logoData, generatedAt: new Date(), outPath })

    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, buf)

    process.stdout.write(`Generated OFMS User Guide: ${outPath}\n`)

    if (!options.logo) {
        process.stdout.write(
            'Tip: pass --logo "/Users/Collins/Downloads/new-logo.png" to embed your updated branding without copying it into the repo.\n'
        )
    }
}

main().catch(err => {
    process.stderr.write(String(err?.stack || err?.message || err) + '\n')
    process.exit(1)
})
