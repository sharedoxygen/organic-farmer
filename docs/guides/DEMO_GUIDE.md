# OFMS Demo Guide - Organic Farm Management System
### Complete End-to-End Demonstration Document

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Demo Users & Roles](#demo-users--roles)
3. [Complete Feature Coverage](#complete-feature-coverage)
4. [Seed-to-Table Journey](#seed-to-table-journey)
5. [Role-Based Scenarios](#role-based-scenarios)
6. [Testing Checklist](#testing-checklist)

---

## 🌱 System Overview

The **Organic Farm Management System (OFMS)** is a comprehensive enterprise solution designed specifically for organic microgreens production facilities. It provides complete farm-to-fork traceability while ensuring USDA Organic and FDA FSMA compliance.

### Core Business Capabilities
- **Production Planning & Forecasting** - AI-powered demand forecasting and production scheduling
- **Batch Management** - Complete lifecycle tracking from seed to harvest
- **Quality Control** - Multi-point inspection system with compliance tracking
- **Inventory Management** - Real-time tracking of seeds, supplies, and finished products
- **Sales & Order Management** - B2B and B2C customer management with automated fulfillment
- **Traceability** - Complete chain of custody from seed source to customer delivery
- **Equipment & Facilities** - IoT sensor integration and maintenance scheduling
- **Analytics & Reporting** - Real-time dashboards and business intelligence
- **AI Insights** - Computer vision for crop health and predictive analytics

### Database: `afarm_d`
All demo data is persisted in the PostgreSQL database with complete referential integrity.

---

## 👥 Demo Users & Roles

### Login URL: http://localhost:3005/auth/signin

| Role | Email | Password | Responsibilities |
|------|-------|----------|------------------|
| **System Administrator** | admin@ofms.com | REDACTED_TEST_PASSWORD | Full system access, user management, system configuration |
| **Farm Manager** | sarah.chen@ofms.com | REDACTED_TEST_PASSWORD | Operations oversight, planning, resource allocation |
| **Operations Manager** | operations@ofms.com | REDACTED_TEST_PASSWORD | Daily operations, staff coordination |
| **Production Lead** | production.lead@ofms.com | REDACTED_TEST_PASSWORD | Production scheduling, batch management |
| **Quality Lead** | quality.lead@ofms.com | REDACTED_TEST_PASSWORD | Quality assurance, compliance management |
| **Team Member** | team.member@ofms.com | REDACTED_TEST_PASSWORD | Daily production tasks |
| **Quality Specialist** | quality@ofms.com | REDACTED_TEST_PASSWORD | Quality inspections, testing |
| **Senior Grower** | grower@ofms.com | REDACTED_TEST_PASSWORD | Crop management, growing operations |
| **Harvest Specialist** | harvest@ofms.com | REDACTED_TEST_PASSWORD | Harvesting operations, yield tracking |

---

## 🚀 Complete Feature Coverage

### 1. Dashboard
**Path:** `/dashboard`
- **Key Metrics:** Total batches, harvest ready, quality score, revenue
- **Recent Activity:** Real-time updates on production activities
- **Quick Actions:** Start batch, quality check, view orders

### 2. Planning & Forecasting
**Path:** `/planning/*`

#### 2.1 Production Planning (`/planning/production`)
- Create production schedules
- Allocate resources to batches
- View capacity utilization

#### 2.2 Crop Planning (`/planning/crops`)
- Variety selection with AI recommendations
- Seasonal planning
- Yield optimization

#### 2.3 Demand Forecasting (`/planning/forecasting`)
- AI-powered demand predictions
- Market trend analysis
- Customer insights

#### 2.4 Resource Planning (`/planning/resources`)
- Zone allocation
- Equipment scheduling
- Labor management

#### 2.5 Production Calendar (`/planning/calendar`)
- Visual schedule of all activities
- Drag-and-drop rescheduling
- Conflict detection

### 3. Production Operations
**Path:** `/production/*`

#### 3.1 Batch Management (`/production/batches`)
- Create new batches
- Track batch lifecycle
- Monitor growing conditions

#### 3.2 Seed Management (`/production/seeds`)
- Seed inventory tracking
- Supplier management
- Organic certification verification

#### 3.3 Environment Control (`/production/environments`)
- Real-time zone monitoring
- Temperature/humidity alerts
- Climate control integration

#### 3.4 Harvesting (`/production/harvesting`)
- Harvest scheduling
- Yield recording
- Quality grading

### 4. Quality & Compliance
**Path:** `/quality/*`

#### 4.1 Quality Control (`/quality/control`)
- Multi-point inspections
- Pass/fail criteria
- Corrective actions

#### 4.2 Organic Compliance (`/quality/organic`)
- USDA Organic tracking
- Input verification
- Audit trails

#### 4.3 Food Safety (`/quality/food-safety`)
- FSMA compliance
- Sanitation records
- Training logs

#### 4.4 Certifications (`/quality/certifications`)
- Certificate management
- Renewal tracking
- Audit preparation

#### 4.5 Audit Logs (`/quality/audits`)
- Complete activity history
- Compliance reporting
- User actions tracking

### 5. Inventory Management
**Path:** `/inventory/*`

#### 5.1 Stock Management (`/inventory/stock`)
- Real-time inventory levels
- Low stock alerts
- Reorder points

#### 5.2 Supplies (`/inventory/supplies`)
- Growing media tracking
- Nutrient management
- Tool inventory

#### 5.3 Packaging (`/inventory/packaging`)
- Container inventory
- Label management
- Sustainability tracking

#### 5.4 Equipment (`/inventory/equipment`)
- Equipment status
- Usage tracking
- Depreciation

### 6. Sales & Orders
**Path:** `/sales/*`

#### 6.1 Order Management (`/sales/orders`)
- Order creation and tracking
- Fulfillment workflow
- Delivery scheduling

#### 6.2 B2B Customers (`/sales/b2b-customers`)
- Restaurant partnerships
- Wholesale accounts
- Contract management

#### 6.3 B2C Customers (`/sales/b2c-customers`)
- Direct consumer sales
- Subscription management
- Customer preferences

#### 6.4 Pricing (`/sales/pricing`)
- Dynamic pricing
- Volume discounts
- Contract pricing

### 7. Traceability & Documentation
**Path:** `/traceability/*`

#### 7.1 Lot Tracking (`/traceability/lots`)
- Lot number generation
- Chain of custody
- Recall management

#### 7.2 Seed-to-Sale (`/traceability/seed-to-sale`)
- Complete product journey
- Documentation trail
- Compliance reporting

### 8. Equipment & Facilities
**Path:** `/equipment/*`

#### 8.1 Equipment Management (`/equipment/management`)
- Asset tracking
- Maintenance scheduling
- Performance monitoring

#### 8.2 IoT Sensors (`/equipment/sensors`)
- Real-time monitoring
- Alert configuration
- Historical data

#### 8.3 Maintenance (`/equipment/maintenance`)
- Preventive maintenance
- Work orders
- Service history

### 9. Analytics & Reporting
**Path:** `/analytics/*`

#### 9.1 Production Analytics (`/analytics/production`)
- Yield analysis
- Efficiency metrics
- Trend identification

#### 9.2 Financial Reports (`/analytics/financial`)
- Revenue tracking
- Cost analysis
- Profitability reports

#### 9.3 Market Analysis (`/analytics/market`)
- Competitor tracking
- Price analysis
- Demand patterns

#### 9.4 Yield Analysis (`/analytics/yield`)
- Variety performance
- Zone efficiency
- Optimization insights

### 10. AI Insights
**Path:** `/ai-insights`
- Crop health detection using computer vision
- Predictive analytics
- Optimization recommendations
- Anomaly detection

### 11. Task Management
**Path:** `/tasks/*`

#### 11.1 Daily Tasks (`/tasks/daily`)
- Task assignment
- Priority management
- Completion tracking

#### 11.2 Work Orders (`/tasks/work-orders`)
- Create work orders
- Assign to teams
- Track progress

#### 11.3 Team Assignments (`/tasks/assignments`)
- Resource allocation
- Skill matching
- Workload balancing

### 12. Integrations
**Path:** `/integrations`
- QuickBooks integration
- IoT platform connections
- Email/SMS notifications
- Weather service API

### 13. Administration
**Path:** `/settings/*`

#### 13.1 User Management (`/settings/users`)
- User creation
- Role assignment
- Access control

#### 13.2 System Settings (`/settings`)
- Farm configuration
- Notification preferences
- System parameters

---

## 🌾 Seed-to-Table Journey

### Complete Use Case: Kale Microgreens for Fresh Greens Restaurant

#### Phase 1: Seed Procurement (Admin/Manager)
1. **Login:** sarah.chen@ofms.com
2. Navigate to **Production > Seeds**
3. Click "Add New Seed Variety"
   - Name: "Kale - Red Russian"
   - Supplier: "Johnny's Selected Seeds"
   - Organic Cert #: "MOSA-12345"
   - Cost: $45/lb
   - Min Stock: 10 lbs
4. Create Purchase Order for 50 lbs

#### Phase 2: Production Planning (Production Lead)
1. **Login:** production.lead@ofms.com
2. Navigate to **Planning > Production**
3. Create new production plan:
   - Variety: Kale - Red Russian
   - Quantity: 10 trays
   - Zone: Greenhouse A
   - Start Date: Today
   - Expected Harvest: 14 days

#### Phase 3: Batch Creation (Team Member)
1. **Login:** team.member@ofms.com
2. Navigate to **Production > Batches**
3. Create new batch:
   - Batch #: KAL-2024-001
   - Seeds: 200g from lot
   - Zone: Greenhouse A, Table 3
   - Seeding density: 20g/tray
4. Complete seeding task

#### Phase 4: Growing & Monitoring (Senior Grower)
1. **Login:** grower@ofms.com
2. Navigate to **Production > Environments**
3. Monitor daily:
   - Temperature: 22°C
   - Humidity: 65%
   - Light: 16 hours
4. Navigate to **Tasks > Daily**
5. Complete watering tasks
6. Log observations

#### Phase 5: Quality Inspection (Quality Specialist)
1. **Login:** quality@ofms.com
2. Navigate to **Quality > Control**
3. Perform Day 7 inspection:
   - Visual: Color uniformity ✓
   - Height: 2-3 inches ✓
   - Density: Good coverage ✓
   - Pests: None detected ✓
   - Grade: A
4. Upload photos for AI analysis

#### Phase 6: Harvest Planning (Harvest Specialist)
1. **Login:** harvest@ofms.com
2. Navigate to **Production > Harvesting**
3. Schedule harvest:
   - Batch: KAL-2024-001
   - Date: Day 14
   - Expected Yield: 8 lbs
   - Crew: 2 people
   - Time: 6:00 AM

#### Phase 7: Order Management (Operations Manager)
1. **Login:** operations@ofms.com
2. Navigate to **Sales > Orders**
3. Create order:
   - Customer: Fresh Greens Restaurant
   - Product: Kale Microgreens
   - Quantity: 5 lbs
   - Price: $24/lb
   - Delivery: Next day, 7 AM
4. Allocate from batch KAL-2024-001

#### Phase 8: Harvest Execution (Harvest Specialist)
1. **Login:** harvest@ofms.com
2. Navigate to **Tasks > Daily**
3. Execute harvest:
   - Actual yield: 8.2 lbs
   - Quality grade: A
   - Time taken: 45 minutes
4. Move to cold storage

#### Phase 9: Quality Check & Packaging (Quality Lead)
1. **Login:** quality.lead@ofms.com
2. Navigate to **Quality > Control**
3. Post-harvest inspection:
   - Appearance: Fresh, vibrant
   - Contamination: None
   - Temperature: 4°C
   - Shelf life: 10 days
4. Approve for packaging
5. Generate lot code: LOT-KAL-2024-001-A

#### Phase 10: Fulfillment (Team Member)
1. **Login:** team.member@ofms.com
2. Navigate to **Sales > Orders**
3. Process order:
   - Pack 5 lbs in clamshells
   - Apply labels with lot code
   - Add harvest date
   - Include organic certificate
4. Stage for delivery

#### Phase 11: Traceability Documentation (Quality Lead)
1. **Login:** quality.lead@ofms.com
2. Navigate to **Traceability > Seed-to-Sale**
3. Verify complete chain:
   - Seed source ✓
   - Growing conditions ✓
   - Inputs used ✓
   - Quality checks ✓
   - Harvest data ✓
   - Customer info ✓

#### Phase 12: Delivery & Analytics (Manager)
1. **Login:** sarah.chen@ofms.com
2. Navigate to **Sales > Orders**
3. Mark order delivered
4. Navigate to **Analytics > Production**
5. Review metrics:
   - Yield efficiency: 102.5%
   - Quality score: 95%
   - Cycle time: 14 days
   - Profitability: 68% margin

---

## 🎯 Role-Based Scenarios

### Administrator Scenario
1. Create new user account
2. Assign multiple roles
3. Configure system settings
4. Review audit logs
5. Generate compliance reports

### Manager Scenario
1. Review dashboard metrics
2. Approve production plans
3. Analyze financial reports
4. Manage customer relationships
5. Strategic planning with AI insights

### Production Lead Scenario
1. Create weekly production schedule
2. Assign batches to zones
3. Monitor resource utilization
4. Coordinate with quality team
5. Optimize growing conditions

### Quality Specialist Scenario
1. Perform daily inspections
2. Document non-conformances
3. Implement corrective actions
4. Maintain certification records
5. Prepare for audits

### Team Member Scenario
1. View daily task list
2. Complete assigned activities
3. Log time and observations
4. Report issues
5. Update batch status

---

## ✅ Testing Checklist

### Data Validation
- [ ] All users can login with credentials
- [ ] Role-based access control works correctly
- [ ] Data persists across sessions
- [ ] Relationships maintain integrity

### Feature Testing
- [ ] Dashboard loads with real metrics
- [ ] All navigation menu items functional
- [ ] Forms save data correctly
- [ ] Reports generate accurately
- [ ] Search and filters work

### Integration Testing
- [ ] API endpoints return correct data
- [ ] File uploads work (images, documents)
- [ ] Real-time updates function
- [ ] Export features work
- [ ] Print functionality operates

### Compliance Testing
- [ ] Audit trails capture all actions
- [ ] Required fields enforce validation
- [ ] Certification tracking accurate
- [ ] Traceability chain complete

### Performance Testing
- [ ] Pages load within 3 seconds
- [ ] Large datasets paginate correctly
- [ ] Concurrent users supported
- [ ] No memory leaks observed

---

## 📝 Notes

1. **Demo Reset:** Run `npm run load-comprehensive-data` to reset demo data
2. **API Testing:** Use Postman collection in `/docs/api`
3. **Mobile Testing:** System is responsive, test on various devices
4. **Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)
5. **Data Backup:** Database backed up hourly in demo environment

---

## 🚨 Support

For demo issues or questions:
- Technical Issues: Check console for errors
- Data Issues: Verify database connection
- Login Issues: Ensure correct credentials
- Feature Questions: Refer to user manual

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Environment:** Development/Demo 