-- Growing Environments Schema for OFMS
-- Professional system for managing growing environments with proper organic crop standards

-- Main growing environments table
CREATE TABLE IF NOT EXISTS growing_environments (
    id TEXT PRIMARY KEY DEFAULT ('env-' || substring(gen_random_uuid()::text, 1, 8)),
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    environment_type VARCHAR(50) NOT NULL, -- 'indoor', 'greenhouse', 'high_tunnel', 'outdoor', 'grow_room', 'nursery'
    location VARCHAR(255), -- Physical location description
    
    -- Physical dimensions
    total_capacity INTEGER DEFAULT 0, -- Total number of plants/trays/etc
    length_meters DECIMAL(8,2),
    width_meters DECIMAL(8,2),
    height_meters DECIMAL(8,2),
    
    -- Environmental controls and capabilities
    climate_controlled BOOLEAN DEFAULT false,
    lighting_type VARCHAR(50) DEFAULT 'natural', -- 'natural', 'led', 'fluorescent', 'hps', 'mixed'
    lighting_intensity_min DECIMAL(8,2), -- μmol/m²/s
    lighting_intensity_max DECIMAL(8,2), -- μmol/m²/s
    daily_light_hours DECIMAL(4,2), -- Hours of light per day
    irrigation_system VARCHAR(50) DEFAULT 'manual', -- 'manual', 'drip', 'spray', 'hydroponic', 'ebb_flow', 'bottom_watering'
    ventilation_type VARCHAR(50) DEFAULT 'natural', -- 'natural', 'forced_air', 'oscillating_fans', 'exhaust_fans'
    
    -- Optimal ranges for microgreens/organic crops
    optimal_temperature_min DECIMAL(5,2) DEFAULT 18.0, -- Celsius
    optimal_temperature_max DECIMAL(5,2) DEFAULT 24.0, -- Celsius
    optimal_humidity_min DECIMAL(5,2) DEFAULT 50.0, -- Percentage
    optimal_humidity_max DECIMAL(5,2) DEFAULT 65.0, -- Percentage
    optimal_co2_min INTEGER DEFAULT 400, -- ppm
    optimal_co2_max INTEGER DEFAULT 800, -- ppm
    
    -- Growing media options
    growing_media_types TEXT[], -- 'soil', 'coconut_coir', 'hemp_mats', 'peat_moss', 'sterile_media'
    water_ph_min DECIMAL(3,1) DEFAULT 6.0,
    water_ph_max DECIMAL(3,1) DEFAULT 6.8,
    
    -- Safety and quality
    organic_certified BOOLEAN DEFAULT true,
    pest_control_methods TEXT[], -- 'integrated_pest_management', 'beneficial_insects', 'organic_sprays'
    sanitation_protocol TEXT,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'maintenance', 'inactive'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environment sections (configurable subdivisions)
CREATE TABLE IF NOT EXISTS environment_sections (
    id TEXT PRIMARY KEY DEFAULT ('section-' || substring(gen_random_uuid()::text, 1, 8)),
    environment_id TEXT NOT NULL REFERENCES growing_environments(id) ON DELETE CASCADE,
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    
    section_name VARCHAR(255) NOT NULL,
    section_type VARCHAR(50) NOT NULL, -- 'shelf', 'rack', 'row', 'bay', 'tray', 'bed', 'bench', 'zone', 'growing_station'
    
    -- Capacity and positioning
    capacity INTEGER DEFAULT 1, -- Number of plants/trays this section can hold
    position_x DECIMAL(8,2) DEFAULT 0, -- X coordinate for layout
    position_y DECIMAL(8,2) DEFAULT 0, -- Y coordinate for layout
    position_z DECIMAL(8,2) DEFAULT 0, -- Z coordinate for layout (height/level)
    
    -- Section-specific attributes
    shelf_level INTEGER, -- For multi-level shelving systems
    row_number INTEGER, -- For field rows or greenhouse rows
    bay_identifier VARCHAR(50), -- For warehouse-style organization
    tray_size VARCHAR(50), -- '10x20', '5x5', 'standard', 'custom'
    
    -- Environmental specifics for this section
    has_supplemental_lighting BOOLEAN DEFAULT false,
    has_heating_mat BOOLEAN DEFAULT false,
    water_source VARCHAR(50), -- 'municipal', 'well', 'rainwater', 'filtered'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environmental sensor readings
CREATE TABLE IF NOT EXISTS environment_sensors (
    id TEXT PRIMARY KEY DEFAULT ('sensor-' || substring(gen_random_uuid()::text, 1, 8)),
    environment_id TEXT NOT NULL REFERENCES growing_environments(id) ON DELETE CASCADE,
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    
    sensor_type VARCHAR(50) NOT NULL, -- 'temperature', 'humidity', 'co2', 'light_intensity', 'ph', 'ec', 'soil_moisture', 'air_circulation'
    sensor_location VARCHAR(255), -- Specific location within environment
    
    -- Reading data
    reading_value DECIMAL(10,4) NOT NULL,
    reading_unit VARCHAR(20) NOT NULL, -- 'celsius', 'fahrenheit', 'percent', 'ppm', 'umol_m2_s', 'ph', 'ec_ms_cm'
    reading_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Quality indicators
    is_within_range BOOLEAN,
    alert_level VARCHAR(20) DEFAULT 'normal', -- 'normal', 'warning', 'critical'
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environment configurations (templates for different crop types)
CREATE TABLE IF NOT EXISTS environment_configurations (
    id TEXT PRIMARY KEY DEFAULT ('config-' || substring(gen_random_uuid()::text, 1, 8)),
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    
    configuration_name VARCHAR(255) NOT NULL,
    crop_types TEXT[], -- Array of crop types this config is optimized for
    environment_type VARCHAR(50) NOT NULL,
    
    -- Optimal environmental parameters
    target_temperature_min DECIMAL(5,2),
    target_temperature_max DECIMAL(5,2),
    target_humidity_min DECIMAL(5,2),
    target_humidity_max DECIMAL(5,2),
    target_co2_min INTEGER,
    target_co2_max INTEGER,
    target_light_hours DECIMAL(4,2),
    target_light_intensity_min DECIMAL(8,2), -- μmol/m²/s
    target_light_intensity_max DECIMAL(8,2), -- μmol/m²/s
    
    -- Growth stage specific settings
    germination_temperature DECIMAL(5,2),
    germination_humidity DECIMAL(5,2),
    germination_duration_days INTEGER,
    growing_temperature DECIMAL(5,2),
    growing_humidity DECIMAL(5,2),
    harvest_duration_days INTEGER,
    
    -- Media and water requirements
    preferred_growing_media TEXT[],
    water_ph_optimal DECIMAL(3,1),
    bottom_watering_recommended BOOLEAN DEFAULT true,
    
    -- Configuration metadata
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Environment schedules (automated control schedules)
CREATE TABLE IF NOT EXISTS environment_schedules (
    id TEXT PRIMARY KEY DEFAULT ('schedule-' || substring(gen_random_uuid()::text, 1, 8)),
    environment_id TEXT NOT NULL REFERENCES growing_environments(id) ON DELETE CASCADE,
    farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    
    schedule_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(50) NOT NULL, -- 'lighting', 'temperature', 'humidity', 'irrigation', 'ventilation'
    
    -- Schedule timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday to 6=Saturday
    
    -- Target values
    target_value DECIMAL(10,4),
    target_unit VARCHAR(20),
    
    -- Schedule parameters
    ramp_up_minutes INTEGER DEFAULT 0, -- Gradual change period
    ramp_down_minutes INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key relationships for batches to sections
ALTER TABLE batches ADD COLUMN IF NOT EXISTS environment_section_id TEXT REFERENCES environment_sections(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_growing_environments_farm_id ON growing_environments(farm_id);
CREATE INDEX IF NOT EXISTS idx_growing_environments_type ON growing_environments(environment_type);
CREATE INDEX IF NOT EXISTS idx_growing_environments_status ON growing_environments(status);

CREATE INDEX IF NOT EXISTS idx_environment_sections_environment_id ON environment_sections(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_sections_farm_id ON environment_sections(farm_id);
CREATE INDEX IF NOT EXISTS idx_environment_sections_type ON environment_sections(section_type);

CREATE INDEX IF NOT EXISTS idx_environment_sensors_environment_id ON environment_sensors(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_sensors_reading_time ON environment_sensors(reading_time);
CREATE INDEX IF NOT EXISTS idx_environment_sensors_type ON environment_sensors(sensor_type);

CREATE INDEX IF NOT EXISTS idx_environment_configurations_farm_id ON environment_configurations(farm_id);
CREATE INDEX IF NOT EXISTS idx_environment_schedules_environment_id ON environment_schedules(environment_id);

-- Add comments for documentation
COMMENT ON TABLE growing_environments IS 'Professional growing environments for organic crop production';
COMMENT ON TABLE environment_sections IS 'Configurable sections within environments (shelves, racks, rows, trays, etc.)';
COMMENT ON TABLE environment_sensors IS 'Environmental monitoring data with professional quality standards';
COMMENT ON TABLE environment_configurations IS 'Crop-specific environmental templates based on professional growing standards';
COMMENT ON TABLE environment_schedules IS 'Automated schedules for environmental controls';

COMMENT ON COLUMN growing_environments.environment_type IS 'Type: indoor, greenhouse, high_tunnel, outdoor, grow_room, nursery';
COMMENT ON COLUMN environment_sections.section_type IS 'Type: shelf, rack, row, bay, tray, bed, bench, zone, growing_station';
COMMENT ON COLUMN environment_sensors.sensor_type IS 'Type: temperature, humidity, co2, light_intensity, ph, ec, soil_moisture, air_circulation'; 