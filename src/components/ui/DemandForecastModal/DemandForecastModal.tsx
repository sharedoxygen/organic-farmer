'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal/Modal';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { useTenant } from '@/components/TenantProvider';
import { ForecastChart } from './ForecastChart';
import styles from './DemandForecastModal.module.css';

interface ForecastPrediction {
    date: string;
    predictedDemand: number;
    confidence: number;
    priceEstimate: number;
    factors: {
        seasonal: number;
        trend: number;
        market: number;
        weather: number;
    };
}

interface ForecastResult {
    crop: string;
    predictions: ForecastPrediction[];
    accuracy: number;
    modelType: string;
    factors: {
        seasonal: number;
        trend: number;
        market: number;
        weather: number;
    };
}

interface DemandForecastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: (forecast: ForecastResult) => void;
}

export function DemandForecastModal({
    isOpen,
    onClose,
    onSave
}: DemandForecastModalProps) {
    const { currentFarm } = useTenant();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecast, setForecast] = useState<ForecastResult | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        cropType: 'Arugula',
        daysAhead: 30,
        includeSeasonality: true,
        includeMarketTrends: true,
        includeWeatherPatterns: true,
        confidenceThreshold: 0.7,
        marketConditions: {
            currentPrice: 0,
            demandTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
            competitorActivity: 'normal' as 'low' | 'normal' | 'high',
            seasonalFactor: 1.0
        }
    });

    // Available crops from the system
    const availableCrops = useMemo(() => [
        'Arugula', 'Basil', 'Kale', 'Broccoli', 'Cilantro', 'Mustard',
        'Spinach', 'Lettuce', 'Chard', 'Watercress', 'Mizuna', 'Bok Choy'
    ], []);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setForecast(null);
            setError(null);
            setFormData(prev => ({
                ...prev,
                cropType: 'Arugula',
                daysAhead: 30
            }));
        }
    }, [isOpen]);

    const handleFormChange = useCallback((field: string, value: string | number | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleMarketConditionChange = useCallback((field: string, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            marketConditions: {
                ...prev.marketConditions,
                [field]: value
            }
        }));
    }, []);

    const generateForecast = useCallback(async () => {
        if (!currentFarm) {
            setError('No farm selected');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('🔮 Generating AI forecast for:', formData.cropType);

            const response = await fetch('/api/ai/demand-forecast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': currentFarm.id
                },
                body: JSON.stringify({
                    cropType: formData.cropType,
                    daysAhead: formData.daysAhead,
                    currentMarketData: formData.marketConditions,
                    options: {
                        includeSeasonality: formData.includeSeasonality,
                        includeMarketTrends: formData.includeMarketTrends,
                        includeWeatherPatterns: formData.includeWeatherPatterns,
                        confidenceThreshold: formData.confidenceThreshold
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setForecast(data.forecast);
                setStep(3); // Move to results step
                console.log('✅ Forecast generated successfully');
            } else {
                throw new Error(data.error || 'Failed to generate forecast');
            }

        } catch (error) {
            console.error('❌ Forecast generation failed:', error);
            setError(error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [currentFarm, formData]);

    const handleSave = useCallback(async () => {
        if (!forecast || !onSave) return;

        try {
            await onSave(forecast);
            onClose();
        } catch (error) {
            console.error('❌ Failed to save forecast:', error);
            setError('Failed to save forecast');
        }
    }, [forecast, onSave, onClose]);

    const formatCurrency = useMemo(() => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    const renderStep1 = () => (
        <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
                <h3>🌱 Select Crop & Parameters</h3>
                <p>Choose the crop type and forecast parameters</p>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.formField}>
                    <label className={styles.label}>
                        Crop Type <span className={styles.required}>*</span>
                    </label>
                    <select
                        value={formData.cropType}
                        onChange={(e) => handleFormChange('cropType', e.target.value)}
                        className={styles.select}
                    >
                        {availableCrops.map(crop => (
                            <option key={crop} value={crop}>{crop}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formField}>
                    <label className={styles.label}>
                        Days Ahead <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.daysAhead}
                        onChange={(e) => handleFormChange('daysAhead', parseInt(e.target.value))}
                        min={7}
                        max={365}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formField}>
                    <label className={styles.label}>
                        Confidence Threshold <span className={styles.required}>*</span>
                    </label>
                    <input
                        type="number"
                        value={formData.confidenceThreshold}
                        onChange={(e) => handleFormChange('confidenceThreshold', parseFloat(e.target.value))}
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        className={styles.input}
                    />
                </div>
            </div>

            <div className={styles.toggleSection}>
                <h4>Analysis Options</h4>
                <div className={styles.toggleGrid}>
                    <div className={styles.toggleItem}>
                        <input
                            type="checkbox"
                            id="seasonality"
                            checked={formData.includeSeasonality}
                            onChange={(e) => handleFormChange('includeSeasonality', e.target.checked)}
                            className={styles.checkbox}
                        />
                        <label htmlFor="seasonality" className={styles.toggleLabel}>
                            Include Seasonality
                        </label>
                    </div>
                    <div className={styles.toggleItem}>
                        <input
                            type="checkbox"
                            id="marketTrends"
                            checked={formData.includeMarketTrends}
                            onChange={(e) => handleFormChange('includeMarketTrends', e.target.checked)}
                            className={styles.checkbox}
                        />
                        <label htmlFor="marketTrends" className={styles.toggleLabel}>
                            Include Market Trends
                        </label>
                    </div>
                    <div className={styles.toggleItem}>
                        <input
                            type="checkbox"
                            id="weatherPatterns"
                            checked={formData.includeWeatherPatterns}
                            onChange={(e) => handleFormChange('includeWeatherPatterns', e.target.checked)}
                            className={styles.checkbox}
                        />
                        <label htmlFor="weatherPatterns" className={styles.toggleLabel}>
                            Include Weather Patterns
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
                <h3>📊 Market Conditions</h3>
                <p>Provide current market data for better predictions</p>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.formField}>
                    <label className={styles.label}>Current Price ($/lb)</label>
                    <input
                        type="number"
                        value={formData.marketConditions.currentPrice}
                        onChange={(e) => handleMarketConditionChange('currentPrice', parseFloat(e.target.value))}
                        min={0}
                        step={0.01}
                        className={styles.input}
                    />
                </div>

                <div className={styles.formField}>
                    <label className={styles.label}>Demand Trend</label>
                    <select
                        value={formData.marketConditions.demandTrend}
                        onChange={(e) => handleMarketConditionChange('demandTrend', e.target.value)}
                        className={styles.select}
                    >
                        <option value="increasing">📈 Increasing</option>
                        <option value="stable">➡️ Stable</option>
                        <option value="decreasing">📉 Decreasing</option>
                    </select>
                </div>

                <div className={styles.formField}>
                    <label className={styles.label}>Competitor Activity</label>
                    <select
                        value={formData.marketConditions.competitorActivity}
                        onChange={(e) => handleMarketConditionChange('competitorActivity', e.target.value)}
                        className={styles.select}
                    >
                        <option value="low">🟢 Low</option>
                        <option value="normal">🟡 Normal</option>
                        <option value="high">🔴 High</option>
                    </select>
                </div>

                <div className={styles.formField}>
                    <label className={styles.label}>Seasonal Factor</label>
                    <input
                        type="number"
                        value={formData.marketConditions.seasonalFactor}
                        onChange={(e) => handleMarketConditionChange('seasonalFactor', parseFloat(e.target.value))}
                        min={0.1}
                        max={3.0}
                        step={0.1}
                        className={styles.input}
                    />
                </div>
            </div>

            <Card className={styles.previewCard}>
                <h4>📋 Forecast Preview</h4>
                <div className={styles.previewGrid}>
                    <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>Crop:</span>
                        <span className={styles.previewValue}>{formData.cropType}</span>
                    </div>
                    <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>Duration:</span>
                        <span className={styles.previewValue}>{formData.daysAhead} days</span>
                    </div>
                    <div className={styles.previewItem}>
                        <span className={styles.previewLabel}>Confidence:</span>
                        <span className={styles.previewValue}>{(formData.confidenceThreshold * 100).toFixed(0)}%</span>
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderStep3 = () => {
        if (!forecast) return null;

        const totalDemand = forecast.predictions.reduce((sum, pred) => sum + pred.predictedDemand, 0);
        const avgConfidence = forecast.predictions.reduce((sum, pred) => sum + pred.confidence, 0) / forecast.predictions.length;
        const avgPrice = forecast.predictions.reduce((sum, pred) => sum + pred.priceEstimate, 0) / forecast.predictions.length;

        return (
            <div className={styles.stepContent}>
                <div className={styles.stepHeader}>
                    <h3>🎯 Forecast Results</h3>
                    <p>AI-powered demand prediction for {forecast.crop}</p>
                </div>

                <div className={styles.resultsGrid}>
                    <Card className={styles.resultCard}>
                        <div className={styles.resultIcon}>📈</div>
                        <div className={styles.resultDetails}>
                            <div className={styles.resultValue}>{totalDemand.toLocaleString()}</div>
                            <div className={styles.resultLabel}>Total Predicted Demand</div>
                        </div>
                    </Card>

                    <Card className={styles.resultCard}>
                        <div className={styles.resultIcon}>🎯</div>
                        <div className={styles.resultDetails}>
                            <div className={styles.resultValue}>{(avgConfidence * 100).toFixed(1)}%</div>
                            <div className={styles.resultLabel}>Average Confidence</div>
                        </div>
                    </Card>

                    <Card className={styles.resultCard}>
                        <div className={styles.resultIcon}>💰</div>
                        <div className={styles.resultDetails}>
                            <div className={styles.resultValue}>{formatCurrency.format(avgPrice)}</div>
                            <div className={styles.resultLabel}>Average Price</div>
                        </div>
                    </Card>

                    <Card className={styles.resultCard}>
                        <div className={styles.resultIcon}>🧠</div>
                        <div className={styles.resultDetails}>
                            <div className={styles.resultValue}>{(forecast.accuracy * 100).toFixed(1)}%</div>
                            <div className={styles.resultLabel}>Model Accuracy</div>
                        </div>
                    </Card>
                </div>

                {/* Forecast Chart */}
                <ForecastChart
                    predictions={forecast.predictions}
                    title={`${forecast.crop} Demand Forecast`}
                />

                <Card className={styles.factorsCard}>
                    <h4>📊 Contributing Factors</h4>
                    <div className={styles.factorsGrid}>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>Seasonal</div>
                            <div className={styles.factorBar}>
                                <div
                                    className={styles.factorFill}
                                    style={{ width: `${forecast.factors.seasonal * 100}%` }}
                                />
                            </div>
                            <div className={styles.factorValue}>{(forecast.factors.seasonal * 100).toFixed(0)}%</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>Trend</div>
                            <div className={styles.factorBar}>
                                <div
                                    className={styles.factorFill}
                                    style={{ width: `${forecast.factors.trend * 100}%` }}
                                />
                            </div>
                            <div className={styles.factorValue}>{(forecast.factors.trend * 100).toFixed(0)}%</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>Market</div>
                            <div className={styles.factorBar}>
                                <div
                                    className={styles.factorFill}
                                    style={{ width: `${forecast.factors.market * 100}%` }}
                                />
                            </div>
                            <div className={styles.factorValue}>{(forecast.factors.market * 100).toFixed(0)}%</div>
                        </div>
                        <div className={styles.factorItem}>
                            <div className={styles.factorLabel}>Weather</div>
                            <div className={styles.factorBar}>
                                <div
                                    className={styles.factorFill}
                                    style={{ width: `${forecast.factors.weather * 100}%` }}
                                />
                            </div>
                            <div className={styles.factorValue}>{(forecast.factors.weather * 100).toFixed(0)}%</div>
                        </div>
                    </div>
                </Card>

                <Card className={styles.predictionsCard}>
                    <h4>📅 Prediction Timeline</h4>
                    <div className={styles.predictionsScroll}>
                        {forecast.predictions.slice(0, 10).map((prediction, index) => (
                            <div key={index} className={styles.predictionItem}>
                                <div className={styles.predictionDate}>
                                    {formatDate(prediction.date)}
                                </div>
                                <div className={styles.predictionDemand}>
                                    {prediction.predictedDemand.toLocaleString()} units
                                </div>
                                <div className={styles.predictionPrice}>
                                    {formatCurrency.format(prediction.priceEstimate)}
                                </div>
                                <div className={styles.predictionConfidence}>
                                    {(prediction.confidence * 100).toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    };

    const renderStepIndicator = () => (
        <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepLabel}>Parameters</div>
            </div>
            <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepLabel}>Market Data</div>
            </div>
            <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepLabel}>Results</div>
            </div>
        </div>
    );

    const renderFooter = () => (
        <div className={styles.footer}>
            <div className={styles.footerLeft}>
                {step > 1 && (
                    <Button
                        variant="secondary"
                        onClick={() => setStep(step - 1)}
                        disabled={loading}
                    >
                        ← Back
                    </Button>
                )}
            </div>
            <div className={styles.footerRight}>
                {step < 3 ? (
                    <Button
                        variant="primary"
                        onClick={() => {
                            if (step === 1) {
                                setStep(2);
                            } else {
                                generateForecast();
                            }
                        }}
                        disabled={loading}
                    >
                        {step === 1 ? 'Next →' : loading ? 'Generating...' : '🔮 Generate Forecast'}
                    </Button>
                ) : (
                    <div className={styles.finalActions}>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                        >
                            Close
                        </Button>
                        {onSave && (
                            <Button
                                variant="primary"
                                onClick={handleSave}
                            >
                                💾 Save Forecast
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="🔮 AI Demand Forecasting"
            size="large"
        >
            <div className={styles.modalContent}>
                {renderStepIndicator()}

                {error && (
                    <div className={styles.errorBanner}>
                        <div className={styles.errorIcon}>⚠️</div>
                        <div className={styles.errorText}>{error}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setError(null)}
                        >
                            ×
                        </Button>
                    </div>
                )}

                <div className={styles.stepContainer}>
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {renderFooter()}
            </div>
        </Modal>
    );
} 