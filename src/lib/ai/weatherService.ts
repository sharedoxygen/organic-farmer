/**
 * Weather Integration Service for AI-Enhanced Farming
 * Provides real weather data for demand forecasting and crop management
 */

export interface WeatherData {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    conditions: string;
    uvIndex: number;
    cloudCover: number;
    pressure: number;
}

export interface WeatherForecast {
    date: Date;
    high: number;
    low: number;
    humidity: number;
    precipitation: number;
    precipProbability: number;
    conditions: string;
    growingDegreeDay: number;
    frostRisk: boolean;
    heatStressRisk: boolean;
}

export interface WeatherAlert {
    id: string;
    type: 'FROST' | 'HEAT' | 'STORM' | 'DROUGHT' | 'FLOOD' | 'WIND';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    affectedCrops: string[];
    recommendations: string[];
}

export interface GrowingConditions {
    overallScore: number; // 0-100
    temperatureScore: number;
    humidityScore: number;
    lightScore: number;
    riskFactors: string[];
    opportunities: string[];
}

interface WeatherAPIResponse {
    current?: {
        temp_f: number;
        humidity: number;
        precip_in: number;
        wind_mph: number;
        condition: { text: string };
        uv: number;
        cloud: number;
        pressure_in: number;
    };
    forecast?: {
        forecastday: Array<{
            date: string;
            day: {
                maxtemp_f: number;
                mintemp_f: number;
                avghumidity: number;
                totalprecip_in: number;
                daily_chance_of_rain: number;
                condition: { text: string };
            };
        }>;
    };
}

export class WeatherService {
    private apiKey: string;
    private baseUrl: string;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheDuration = 30 * 60 * 1000; // 30 minutes

    constructor() {
        this.apiKey = process.env.WEATHER_API_KEY || '';
        this.baseUrl = 'https://api.weatherapi.com/v1';

        if (!this.apiKey) {
            console.warn('⚠️ WEATHER_API_KEY not configured, using simulated weather data');
        }
    }

    /**
     * Get current weather conditions
     */
    async getCurrentWeather(location: string): Promise<WeatherData> {
        const cacheKey = `current_${location}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            if (!this.apiKey) {
                return this.simulateCurrentWeather(location);
            }

            const response = await fetch(
                `${this.baseUrl}/current.json?key=${this.apiKey}&q=${encodeURIComponent(location)}`
            );

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data: WeatherAPIResponse = await response.json();
            const weather = this.parseCurrentWeather(data);
            this.setCache(cacheKey, weather);
            return weather;

        } catch (error) {
            console.error('❌ Weather API error:', error);
            return this.simulateCurrentWeather(location);
        }
    }

    /**
     * Get weather forecast for upcoming days
     */
    async getForecast(location: string, days: number = 7): Promise<WeatherForecast[]> {
        const cacheKey = `forecast_${location}_${days}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            if (!this.apiKey) {
                return this.simulateForecast(location, days);
            }

            const response = await fetch(
                `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${encodeURIComponent(location)}&days=${days}`
            );

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data: WeatherAPIResponse = await response.json();
            const forecast = this.parseForecast(data);
            this.setCache(cacheKey, forecast);
            return forecast;

        } catch (error) {
            console.error('❌ Weather forecast error:', error);
            return this.simulateForecast(location, days);
        }
    }

    /**
     * Get weather-based alerts for farming
     */
    async getWeatherAlerts(location: string): Promise<WeatherAlert[]> {
        const forecast = await this.getForecast(location, 7);
        const alerts: WeatherAlert[] = [];

        forecast.forEach((day, index) => {
            // Frost alert
            if (day.frostRisk) {
                alerts.push({
                    id: `frost_${index}`,
                    type: 'FROST',
                    severity: day.low < 28 ? 'CRITICAL' : 'HIGH',
                    title: 'Frost Warning',
                    description: `Low temperature of ${day.low}°F expected on ${day.date.toLocaleDateString()}`,
                    startTime: new Date(day.date.setHours(0, 0, 0, 0)),
                    endTime: new Date(day.date.setHours(8, 0, 0, 0)),
                    affectedCrops: ['Basil', 'Tomatoes', 'Peppers', 'Beans'],
                    recommendations: [
                        'Cover sensitive crops with frost cloth',
                        'Move container plants indoors',
                        'Delay transplanting tender seedlings',
                        'Harvest mature crops before frost'
                    ]
                });
            }

            // Heat stress alert
            if (day.heatStressRisk) {
                alerts.push({
                    id: `heat_${index}`,
                    type: 'HEAT',
                    severity: day.high > 100 ? 'CRITICAL' : 'HIGH',
                    title: 'Heat Stress Warning',
                    description: `High temperature of ${day.high}°F expected on ${day.date.toLocaleDateString()}`,
                    startTime: new Date(day.date.setHours(10, 0, 0, 0)),
                    endTime: new Date(day.date.setHours(18, 0, 0, 0)),
                    affectedCrops: ['Lettuce', 'Spinach', 'Arugula', 'Kale'],
                    recommendations: [
                        'Increase irrigation frequency',
                        'Apply shade cloth to sensitive crops',
                        'Harvest leafy greens early morning',
                        'Delay planting cool-season crops'
                    ]
                });
            }

            // Heavy rain/storm alert
            if (day.precipProbability > 70 && day.precipitation > 1) {
                alerts.push({
                    id: `storm_${index}`,
                    type: 'STORM',
                    severity: day.precipitation > 2 ? 'HIGH' : 'MEDIUM',
                    title: 'Heavy Rain Expected',
                    description: `${day.precipitation}" of rain expected on ${day.date.toLocaleDateString()}`,
                    startTime: day.date,
                    endTime: new Date(day.date.getTime() + 24 * 60 * 60 * 1000),
                    affectedCrops: ['All outdoor crops'],
                    recommendations: [
                        'Ensure proper drainage in growing areas',
                        'Harvest ripe produce before storm',
                        'Secure row covers and structures',
                        'Delay foliar applications'
                    ]
                });
            }
        });

        return alerts;
    }

    /**
     * Calculate growing conditions score
     */
    async getGrowingConditions(location: string, cropType: string): Promise<GrowingConditions> {
        const current = await this.getCurrentWeather(location);
        const forecast = await this.getForecast(location, 3);

        const optimalConditions = this.getCropOptimalConditions(cropType);

        // Calculate temperature score
        const tempDiff = Math.abs(current.temperature - optimalConditions.temperature);
        const temperatureScore = Math.max(0, 100 - tempDiff * 5);

        // Calculate humidity score
        const humidityDiff = Math.abs(current.humidity - optimalConditions.humidity);
        const humidityScore = Math.max(0, 100 - humidityDiff * 2);

        // Calculate light score based on cloud cover
        const lightScore = Math.max(0, 100 - current.cloudCover);

        // Overall score
        const overallScore = Math.round(
            (temperatureScore * 0.4) + (humidityScore * 0.3) + (lightScore * 0.3)
        );

        // Identify risk factors
        const riskFactors: string[] = [];
        const opportunities: string[] = [];

        if (temperatureScore < 60) {
            riskFactors.push(`Temperature ${current.temperature}°F is outside optimal range`);
        }
        if (humidityScore < 60) {
            riskFactors.push(`Humidity ${current.humidity}% may affect crop health`);
        }
        if (forecast.some(d => d.frostRisk)) {
            riskFactors.push('Frost risk in upcoming forecast');
        }
        if (forecast.some(d => d.heatStressRisk)) {
            riskFactors.push('Heat stress risk in upcoming forecast');
        }

        if (overallScore > 80) {
            opportunities.push('Excellent growing conditions - consider expanding production');
        }
        if (forecast.every(d => d.precipProbability < 30)) {
            opportunities.push('Dry period ahead - ideal for harvesting');
        }
        if (temperatureScore > 85 && humidityScore > 85) {
            opportunities.push('Optimal conditions for rapid growth');
        }

        return {
            overallScore,
            temperatureScore,
            humidityScore,
            lightScore,
            riskFactors,
            opportunities
        };
    }

    /**
     * Get weather index for demand forecasting (0-1 scale)
     */
    async getWeatherIndex(location: string): Promise<number> {
        try {
            const conditions = await this.getGrowingConditions(location, 'general');
            return conditions.overallScore / 100;
        } catch (error) {
            console.warn('⚠️ Could not calculate weather index, using default');
            return 0.7;
        }
    }

    /**
     * Calculate Growing Degree Days (GDD)
     */
    calculateGDD(high: number, low: number, baseTemp: number = 50): number {
        const avgTemp = (high + low) / 2;
        return Math.max(0, avgTemp - baseTemp);
    }

    // Private helper methods

    private parseCurrentWeather(data: WeatherAPIResponse): WeatherData {
        const current = data.current!;
        return {
            temperature: current.temp_f,
            humidity: current.humidity,
            precipitation: current.precip_in,
            windSpeed: current.wind_mph,
            conditions: current.condition.text,
            uvIndex: current.uv,
            cloudCover: current.cloud,
            pressure: current.pressure_in
        };
    }

    private parseForecast(data: WeatherAPIResponse): WeatherForecast[] {
        return data.forecast!.forecastday.map(day => {
            const high = day.day.maxtemp_f;
            const low = day.day.mintemp_f;
            return {
                date: new Date(day.date),
                high,
                low,
                humidity: day.day.avghumidity,
                precipitation: day.day.totalprecip_in,
                precipProbability: day.day.daily_chance_of_rain,
                conditions: day.day.condition.text,
                growingDegreeDay: this.calculateGDD(high, low),
                frostRisk: low <= 32,
                heatStressRisk: high >= 90
            };
        });
    }

    private simulateCurrentWeather(location: string): WeatherData {
        const month = new Date().getMonth();
        const baseTemp = this.getSeasonalBaseTemp(month);

        return {
            temperature: baseTemp + (Math.random() * 10 - 5),
            humidity: 50 + Math.random() * 30,
            precipitation: Math.random() > 0.7 ? Math.random() * 0.5 : 0,
            windSpeed: 5 + Math.random() * 10,
            conditions: this.getRandomCondition(),
            uvIndex: Math.floor(3 + Math.random() * 5),
            cloudCover: Math.floor(Math.random() * 60),
            pressure: 29.5 + Math.random() * 1
        };
    }

    private simulateForecast(location: string, days: number): WeatherForecast[] {
        const forecasts: WeatherForecast[] = [];
        const month = new Date().getMonth();
        const baseTemp = this.getSeasonalBaseTemp(month);

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            const high = baseTemp + 10 + (Math.random() * 10 - 5);
            const low = baseTemp - 10 + (Math.random() * 10 - 5);
            const precipProbability = Math.floor(Math.random() * 50);

            forecasts.push({
                date,
                high,
                low,
                humidity: 50 + Math.random() * 30,
                precipitation: precipProbability > 30 ? Math.random() * 1 : 0,
                precipProbability,
                conditions: this.getRandomCondition(),
                growingDegreeDay: this.calculateGDD(high, low),
                frostRisk: low <= 32,
                heatStressRisk: high >= 90
            });
        }

        return forecasts;
    }

    private getSeasonalBaseTemp(month: number): number {
        const temps = [40, 42, 50, 58, 68, 78, 85, 83, 75, 62, 50, 42];
        return temps[month];
    }

    private getRandomCondition(): string {
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }

    private getCropOptimalConditions(cropType: string): { temperature: number; humidity: number } {
        const conditions: Record<string, { temperature: number; humidity: number }> = {
            'Arugula': { temperature: 65, humidity: 60 },
            'Basil': { temperature: 75, humidity: 50 },
            'Kale': { temperature: 60, humidity: 65 },
            'Lettuce': { temperature: 60, humidity: 60 },
            'Spinach': { temperature: 55, humidity: 65 },
            'Tomatoes': { temperature: 75, humidity: 55 },
            'Peppers': { temperature: 80, humidity: 50 },
            'general': { temperature: 70, humidity: 60 }
        };
        return conditions[cropType] || conditions['general'];
    }

    private getFromCache(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}

export const weatherService = new WeatherService();
