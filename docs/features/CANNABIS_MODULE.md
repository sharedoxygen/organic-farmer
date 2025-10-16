# 🌿 Cannabis Cultivation Module

**OFMS Cannabis Extension - Comprehensive Growing & Compliance System**  
**Version**: 1.0.0  
**Compliance**: California BCC Standards

## 📋 Overview

The Cannabis Cultivation Module extends OFMS to support legal cannabis operations with specialized features for strain management, cannabinoid tracking, compliance reporting, and dispensary integration.

---

## 🎯 Key Features

### 1. **Strain Management**
- Detailed cannabinoid profiling (THC, CBD, CBG, etc.)
- Terpene profile tracking
- Genetic lineage documentation
- Phenotype variations
- Medical vs recreational classification

### 2. **Growth Stage Tracking**
- Seedling/Clone management
- Vegetative growth monitoring
- Flowering stage optimization
- Harvest timing calculations
- Curing process tracking

### 3. **Compliance & Reporting**
- State license integration (BCC, CDFA, CDPH)
- METRC API compatibility
- Monthly compliance reports
- Tax calculation automation
- Chain of custody documentation

### 4. **Quality & Testing**
- Potency testing integration
- Contaminant screening records
- Terpene analysis
- Certificate of Analysis (COA) management
- Batch recall procedures

---

## 🌱 Strain Database

### Current Strains (Shared Oxygen Farms)

#### 1. **Blue Dream**
- **Type**: Hybrid (60% Sativa / 40% Indica)
- **THC**: 17-24%
- **CBD**: 0.1-0.2%
- **Terpenes**: Myrcene, Pinene, Caryophyllene
- **Effects**: Relaxed, Happy, Creative
- **Medical Uses**: Depression, Pain, Stress
- **Flowering Time**: 9-10 weeks
- **Yield**: 500-600g/m²

#### 2. **OG Kush**
- **Type**: Indica Dominant (75% Indica / 25% Sativa)
- **THC**: 19-25%
- **CBD**: 0.3%
- **Terpenes**: Limonene, Myrcene, Caryophyllene
- **Effects**: Relaxed, Euphoric, Hungry
- **Medical Uses**: Stress, Pain, Insomnia
- **Flowering Time**: 8-9 weeks
- **Yield**: 450-500g/m²

#### 3. **Girl Scout Cookies**
- **Type**: Hybrid (60% Indica / 40% Sativa)
- **THC**: 19-28%
- **CBD**: 0.1%
- **Terpenes**: Caryophyllene, Limonene, Humulene
- **Effects**: Euphoric, Relaxed, Creative
- **Medical Uses**: Chronic Pain, Nausea, Appetite Loss
- **Flowering Time**: 9-10 weeks
- **Yield**: 400-500g/m²

#### 4. **Jack Herer**
- **Type**: Sativa Dominant (55% Sativa / 45% Indica)
- **THC**: 18-24%
- **CBD**: 0.1-0.3%
- **Terpenes**: Terpinolene, Caryophyllene, Pinene
- **Effects**: Energetic, Creative, Uplifted
- **Medical Uses**: Depression, Fatigue, Stress
- **Flowering Time**: 8-10 weeks
- **Yield**: 400-450g/m²

---

## 🏭 Growing Environments

### Flower Room 1
- **Purpose**: Flowering stage cultivation
- **Capacity**: 200 plants
- **Light Schedule**: 12/12 (flowering)
- **Temperature**: 68-78°F
- **Humidity**: 40-50%
- **CO2**: 1200-1500 ppm

### Veg Room 1
- **Purpose**: Vegetative growth
- **Capacity**: 300 plants
- **Light Schedule**: 18/6 (veg)
- **Temperature**: 70-85°F
- **Humidity**: 50-70%
- **CO2**: 1000-1200 ppm

### Drying/Curing Room
- **Purpose**: Post-harvest processing
- **Capacity**: 50 lbs
- **Temperature**: 60-70°F
- **Humidity**: 55-65%
- **Air Exchange**: Every 15 minutes

---

## 📊 Compliance Features

### License Management
```javascript
// Example License Structure
{
  licenseNumber: "BCC-LIC-420001",
  licenseType: "Adult-Use Cultivation",
  issueDate: "2024-01-01",
  expirationDate: "2025-01-01",
  premiseAddress: "123 Cannabis Lane, CA 90210",
  canopySize: "5000 sq ft"
}
```

### Compliance Tracking
- **Plant Count**: Real-time tracking against license limits
- **Canopy Size**: Automated calculations with alerts
- **Testing Requirements**: Automated scheduling for required tests
- **Reporting Deadlines**: Calendar integration with reminders
- **Inspection Readiness**: Compliance checklist system

### Required Testing
1. **Cannabinoid Potency**
2. **Pesticide Screening**
3. **Microbial Testing**
4. **Heavy Metals**
5. **Mycotoxins**
6. **Foreign Materials**

---

## 💰 Cannabis-Specific Business Features

### Tax Calculations
```javascript
// California Cannabis Tax Structure
{
  cultivationTax: 9.65,        // per ounce of flower
  exciseTax: 15,               // percentage
  stateSalesTax: 7.25,         // percentage
  localTax: 3.5,               // varies by jurisdiction
  totalTaxRate: 25.75          // combined rate
}
```

### Customer Types
1. **Licensed Dispensaries**
   - B2B pricing tiers
   - Volume discounts
   - Net terms payment
   - COA requirements

2. **Medical Collectives**
   - Compassion programs
   - Patient verification
   - Dosage tracking
   - Medical recommendations

### Product Categories
- **Flower**: Whole buds, pre-rolls
- **Trim**: Shake, sugar leaves
- **Concentrates**: (future module)
- **Clones**: Rooted cuttings
- **Seeds**: Feminized, regular

---

## 📱 Workflow Examples

### 1. Clone to Harvest Workflow
```
1. Clone Cutting → Clone Room (14 days)
2. Rooted Clone → Veg Room (4-6 weeks)
3. Vegetative Plant → Flower Room (8-10 weeks)
4. Harvest → Drying Room (7-10 days)
5. Dried Flower → Curing (2-4 weeks)
6. Testing → COA Receipt (3-5 days)
7. Packaged Product → Inventory
```

### 2. Quality Check Process
```
Daily Checks:
- Visual inspection for pests/disease
- Environmental monitoring
- Watering/feeding logs

Weekly Checks:
- Height measurements
- Canopy density
- Trichome development (flowering)

Pre-Harvest:
- Trichome color analysis
- Potency estimation
- Harvest readiness scoring
```

### 3. Compliance Workflow
```
Monthly Requirements:
1. Generate cultivation report
2. Calculate tax obligations
3. Submit to state portal
4. Update METRC tracking
5. Archive documentation
```

---

## 🔒 Security & Access Control

### Role-Based Permissions
- **Cultivation Manager**: Full grow operation access
- **Compliance Officer**: Reporting and documentation
- **Harvest Team**: Limited to harvest/processing
- **Lab Technician**: Testing and quality data

### Audit Trail Features
- Every plant movement tracked
- All weight changes logged
- User actions timestamped
- Compliance reports archived
- Chain of custody maintained

---

## 📈 Analytics & Reporting

### Key Metrics
1. **Yield Analysis**
   - Grams per watt
   - Grams per square foot
   - Strain performance comparison

2. **Quality Metrics**
   - Average THC/CBD levels
   - Testing pass rates
   - Customer satisfaction scores

3. **Financial Analytics**
   - Cost per gram produced
   - Revenue by strain
   - Tax liability tracking

### Dashboard Views
- **Cultivation Overview**: Active plants by stage
- **Compliance Status**: License limits and deadlines
- **Harvest Calendar**: Upcoming harvests and capacity
- **Quality Trends**: Testing results over time

---

## 🚀 Future Enhancements

### Planned Features
1. **METRC API Integration**
   - Automated state reporting
   - Real-time inventory sync
   - Compliance alerts

2. **Advanced Analytics**
   - Predictive yield modeling
   - Optimal harvest timing AI
   - Market demand forecasting

3. **Mobile App**
   - Plant inspection checklists
   - Photo documentation
   - Barcode/RFID scanning

4. **Extraction Module**
   - Concentrate production tracking
   - Solvent management
   - Yield calculations

---

## 🛠️ Configuration

### Environment Variables
```env
# Cannabis Module Settings
CANNABIS_MODULE_ENABLED=true
STATE_LICENSE_NUMBER=BCC-LIC-420001
METRC_API_KEY=your-metrc-key
METRC_API_SECRET=your-metrc-secret
TAX_CALCULATION_MODE=california
```

### Database Extensions
```sql
-- Cannabis-specific fields added to seed_varieties
ALTER TABLE seed_varieties ADD COLUMN strain_type VARCHAR(50);
ALTER TABLE seed_varieties ADD COLUMN thc_content DECIMAL(4,2);
ALTER TABLE seed_varieties ADD COLUMN cbd_content DECIMAL(4,2);
ALTER TABLE seed_varieties ADD COLUMN terpene_profile JSONB;
ALTER TABLE seed_varieties ADD COLUMN medical_uses TEXT[];
ALTER TABLE seed_varieties ADD COLUMN flowering_time_weeks INTEGER;
```

---

## 📚 Compliance Resources

### California Regulations
- [BCC Regulations](https://bcc.ca.gov/laws_regs/)
- [CDFA CalCannabis](https://www.cdfa.ca.gov/calcannabis/)
- [Track-and-Trace (METRC)](https://www.metrc.com/)

### Best Practices
- Maintain detailed cultivation logs
- Document all plant movements
- Keep testing records for 7 years
- Regular compliance audits
- Staff training documentation

---

**Cannabis Module Status**: ✅ Fully Operational  
**Compliance Status**: ✅ California BCC Compliant  
**Last Audit**: January 2025 