# 🔧 Global Admin Guide

**OFMS Administrative Dashboard & Multi-Farm Management**  
**Version**: 1.0.0  
**Access Level**: Global Administrator

## 📋 Overview

The Global Admin Dashboard provides system-wide oversight and management capabilities for the OFMS multi-tenant platform. This guide covers administrative functions, farm management, and system monitoring.

---

## 🚀 Getting Started

### Access Requirements
- **Email**: admin@curryislandmicrogreens.com
- **Role**: Global Administrator
- **URL**: `/admin`

### Initial Login
1. Navigate to `http://localhost:3005/auth/signin`
2. Use global admin credentials
3. Access admin dashboard at `/admin`

---

## 🏢 Farm Management

### Creating a New Farm

#### Via Admin Dashboard
1. Navigate to `/admin`
2. Click "Add New Farm"
3. Complete farm registration:
   ```
   Farm Name: [Business Name]
   Owner Email: [owner@email.com]
   Owner Name: [Full Name]
   Business Name: [Legal Entity]
   Location: [State/Country]
   Subscription Plan: [starter/professional/enterprise]
   ```

#### Via Script (Advanced)
```bash
node scripts/create-new-farm.js \
  --farmName "Green Acres Organic" \
  --ownerEmail "owner@greenacres.com" \
  --ownerName "Jane Farmer" \
  --businessName "Green Acres LLC" \
  --location "Oregon"
```

### Farm Configuration Options
```javascript
{
  farm_name: "Required - Display name",
  business_name: "Optional - Legal entity name",
  subdomain: "Optional - custom.ofms.com",
  subscription_plan: "starter|professional|enterprise",
  trial_ends_at: "30 days from creation",
  settings: {
    timezone: "America/Los_Angeles",
    currency: "USD",
    locale: "en-US",
    features: {
      cannabis_module: false,
      iot_integration: true,
      api_access: true
    }
  }
}
```

---

## 📊 Dashboard Metrics

### System Overview Card
```
Total Farms: 2
Total Users: 13
Total Batches: 123
Monthly Revenue: $45,000
Storage Used: 2.4 GB
Active Subscriptions: 2
```

### Farm-Specific Metrics
Each farm card displays:
- User count
- Active batches
- Monthly revenue
- Storage usage
- Subscription status
- Last activity

### Clickable Actions
- **View Details**: Drill down into farm-specific data
- **Manage Users**: Add/remove farm users
- **Billing**: View/update subscription
- **Settings**: Configure farm preferences

---

## 👥 User Management

### Adding Users to Farms
1. Navigate to farm details
2. Click "Manage Users"
3. Options:
   - **Invite New User**: Send email invitation
   - **Add Existing User**: Assign user to additional farm
   - **Import Users**: Bulk CSV upload

### User Roles at Farm Level
```
OWNER         - Complete farm control, billing access
FARM_MANAGER  - All operations except billing
TEAM_LEAD     - Production and team management
SPECIALIST_LEAD - Specialized area management
TEAM_MEMBER   - Day-to-day operations
SPECIALIST    - Limited specialized access
```

### Multi-Farm User Management
Users can belong to multiple farms with different roles:
```javascript
// Example: User with different roles across farms
{
  email: "consultant@agtech.com",
  farms: [
    { farm: "Farm A", role: "FARM_MANAGER" },
    { farm: "Farm B", role: "SPECIALIST" },
    { farm: "Farm C", role: "TEAM_LEAD" }
  ]
}
```

---

## 💰 Subscription Management

### Plan Tiers

#### Starter Plan
- 1-5 users
- Basic features
- 10 GB storage
- Email support
- $99/month

#### Professional Plan
- 6-20 users
- All features
- 50 GB storage
- Priority support
- API access
- $299/month

#### Enterprise Plan
- Unlimited users
- Custom features
- Unlimited storage
- Dedicated support
- SLA guarantee
- Custom pricing

### Billing Operations
1. **View Current Plan**: See active subscription details
2. **Upgrade/Downgrade**: Change subscription tier
3. **Payment History**: View all transactions
4. **Update Payment**: Change credit card
5. **Cancel Subscription**: Initiate cancellation

### Usage Monitoring
```javascript
// Usage metrics tracked
{
  users: { current: 9, limit: 20 },
  storage: { used: "1.2 GB", limit: "50 GB" },
  api_calls: { month: 1250, limit: 10000 },
  batches: { active: 45, limit: "unlimited" }
}
```

---

## 🔍 System Monitoring

### Performance Metrics
- **Response Time**: Average API response time
- **Uptime**: System availability percentage
- **Error Rate**: Failed requests per hour
- **Active Sessions**: Current logged-in users

### Database Health
```sql
-- Key metrics monitored
- Connection pool usage
- Query performance
- Table sizes
- Index efficiency
- Backup status
```

### Alert Configuration
Set up alerts for:
- Subscription expiration
- Storage limits
- Performance degradation
- Security events
- Compliance deadlines

---

## 🛠️ Administrative Tools

### Data Export
Export farm data for:
- Compliance audits
- Data migration
- Backup purposes
- Analytics

Formats supported:
- CSV
- JSON
- Excel
- PDF reports

### Bulk Operations
1. **User Import/Export**
2. **Batch Data Migration**
3. **Customer List Updates**
4. **Inventory Adjustments**

### System Maintenance
- **Database Optimization**: Run weekly
- **Cache Clearing**: As needed
- **Log Rotation**: Automatic
- **Backup Verification**: Daily

---

## 📈 Analytics & Reporting

### Cross-Farm Analytics
Compare metrics across all farms:
- Production efficiency
- Revenue per user
- Quality scores
- Compliance rates

### Custom Reports
Generate reports for:
- Executive summaries
- Financial analysis
- Operational efficiency
- User activity

### Data Visualization
- Interactive charts
- Trend analysis
- Comparative metrics
- Export capabilities

---

## 🔒 Security Administration

### Access Control
- **IP Whitelisting**: Restrict admin access
- **2FA Enforcement**: Mandatory for admins
- **Session Management**: Force logout capabilities
- **Audit Trails**: All admin actions logged

### Security Monitoring
```javascript
// Security events tracked
{
  failed_logins: "Alert after 3 attempts",
  permission_changes: "Logged with timestamp",
  data_exports: "Tracked with user/reason",
  configuration_changes: "Require confirmation"
}
```

### Compliance Features
- GDPR data requests
- Data retention policies
- Audit log exports
- Compliance reporting

---

## 🚨 Troubleshooting

### Common Issues

#### Farm Creation Fails
- Check email uniqueness
- Verify license limits
- Review error logs

#### User Cannot Access Farm
- Verify farm_users association
- Check user active status
- Review role permissions

#### Subscription Issues
- Verify payment method
- Check subscription status
- Review billing logs

### Debug Tools
```bash
# Check farm associations
node scripts/check-farm-users.js --farmId=xxx

# Verify data integrity
npm run db:integrity:check

# Export audit logs
node scripts/export-audit-logs.js --startDate=2024-01-01
```

---

## 📞 Support Escalation

### Level 1: Self-Service
- Knowledge base articles
- Video tutorials
- Community forum

### Level 2: Support Ticket
- Email: support@ofms.com
- Response time: 24 hours
- Include farm ID and issue details

### Level 3: Emergency Support
- Phone: 1-800-OFMS-911
- Available for Enterprise plans
- Critical system issues only

---

## 🎯 Best Practices

### Farm Management
1. Regular subscription reviews
2. Monitor usage trends
3. Proactive user management
4. Scheduled data backups

### Security
1. Regular password updates
2. Review access logs monthly
3. Update admin contacts
4. Test disaster recovery

### Performance
1. Monitor response times
2. Optimize heavy queries
3. Archive old data
4. Regular maintenance windows

---

## 📅 Administrative Calendar

### Daily Tasks
- Review system alerts
- Check backup status
- Monitor active users

### Weekly Tasks
- Usage report review
- Security audit
- Performance analysis
- User access review

### Monthly Tasks
- Billing reconciliation
- Compliance reporting
- System updates
- Documentation review

---

**Admin Dashboard Status**: ✅ Fully Operational  
**Last System Audit**: January 2025  
**Next Maintenance**: February 1, 2025 