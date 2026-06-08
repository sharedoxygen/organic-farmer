'use client'

import { RadialGauge, LinearMeter } from '@/components/ui/Instrument'
import type { PlantScanResult } from '@/types/plantScan'
import styles from './PlantScanReport.module.css'

interface PlantScanReportProps {
  result: PlantScanResult
  photoUrl: string
  cropType: string
}

function severityClass(severity: string): string {
  if (severity === 'HIGH' || severity === 'critical') return styles.severityHigh
  if (severity === 'MEDIUM' || severity === 'warning') return styles.severityMed
  return styles.severityLow
}

function gaugeStatus(
  score: number
): 'excellent' | 'good' | 'watch' | 'critical' {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'watch'
  return 'critical'
}

export function PlantScanReport({
  result,
  photoUrl,
  cropType,
}: PlantScanReportProps) {
  const { summary } = result
  const healthyPct = Math.max(0, 100 - result.affectedAreaPercent)

  return (
    <div className={styles.report}>
      <header className={styles.hero}>
        <div className={styles.photoFrame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt={`${cropType} scan`} className={styles.photo} />
          <svg className={styles.healthRing} viewBox="0 0 120 120" aria-hidden>
            <circle cx="60" cy="60" r="52" className={styles.ringTrack} />
            <circle
              cx="60"
              cy="60"
              r="52"
              className={styles.ringFill}
              strokeDasharray={`${(summary.overallHealth / 100) * 327} 327`}
            />
          </svg>
          <div className={styles.photoBadge}>
            <span>{summary.overallHealth}%</span>
            <small>Health</small>
          </div>
        </div>

        <div className={styles.heroText}>
          <span className={`${styles.severityPill} ${severityClass(summary.severity)}`}>
            {summary.severity} priority
          </span>
          <h2>{summary.headline}</h2>
          <p className={styles.statusLabel}>{summary.statusLabel}</p>
          <p className={styles.narrative}>{result.narrative}</p>
          <div className={styles.meta}>
            <span>🤖 {result.aiModel}</span>
            <span>🎯 {Math.round(summary.confidence * 100)}% confidence</span>
          </div>
        </div>
      </header>

      <section className={styles.gaugeRow}>
        <RadialGauge
          label="Overall Health"
          value={summary.overallHealth}
          max={100}
          unit="%"
          status={gaugeStatus(summary.overallHealth)}
          icon="🌿"
          size="lg"
        />
        <RadialGauge
          label="AI Confidence"
          value={Math.round(summary.confidence * 100)}
          max={100}
          unit="%"
          status={gaugeStatus(summary.confidence * 100)}
          icon="🔬"
          size="lg"
        />
        <div className={styles.areaChart}>
          <div className={styles.areaChartTitle}>Canopy Assessment</div>
          <div className={styles.areaBars}>
            <div className={styles.areaBarHealthy} style={{ width: `${healthyPct}%` }}>
              <span>Healthy {healthyPct}%</span>
            </div>
            <div
              className={styles.areaBarAffected}
              style={{ width: `${result.affectedAreaPercent}%` }}
            >
              {result.affectedAreaPercent > 8 && (
                <span>Affected {result.affectedAreaPercent}%</span>
              )}
            </div>
          </div>
          <div className={styles.areaLegend}>
            <span><i className={styles.dotHealthy} /> Healthy tissue</span>
            <span><i className={styles.dotAffected} /> Affected area</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Health Indicators</h3>
        <div className={styles.indicatorGrid}>
          {result.healthIndicators.map((ind) => (
            <div key={ind.label} className={styles.indicatorCard}>
              <div className={styles.indicatorHeader}>
                <span>{ind.icon}</span>
                <span>{ind.label}</span>
                <strong>{ind.score}%</strong>
              </div>
              <LinearMeter
                label=""
                value={ind.score}
                max={100}
                unit="%"
                status={ind.status}
                showValue={false}
              />
            </div>
          ))}
        </div>
      </section>

      {result.findings.length > 0 && (
        <section className={styles.section}>
          <h3>Key Findings</h3>
          <div className={styles.findings}>
            {result.findings.map((f, i) => (
              <article
                key={`${f.title}-${i}`}
                className={`${styles.findingCard} ${severityClass(f.severity)}`}
              >
                <span className={styles.findingCategory}>{f.category}</span>
                <h4>{f.title}</h4>
                <p>{f.detail}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h3>Recommended Actions</h3>
        <ol className={styles.actions}>
          {result.recommendations.map((rec) => (
            <li key={rec.priority} className={styles.actionItem}>
              <span className={styles.actionPriority}>{rec.priority}</span>
              <div>
                <strong>{rec.action}</strong>
                <p>{rec.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h3>Organic Treatments</h3>
        <ul className={styles.treatments}>
          {result.organicTreatments.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Care Timeline</h3>
        <div className={styles.timeline}>
          {result.careTimeline.map((step, i) => (
            <div key={`${step.day}-${i}`} className={styles.timelineStep}>
              <div className={styles.timelineMarker}>
                <span>Day {step.day}</span>
              </div>
              <p>{step.task}</p>
            </div>
          ))}
        </div>
      </section>

      {result.reasoning && (
        <section className={`${styles.section} ${styles.reasoning}`}>
          <h3>Diagnostic Reasoning</h3>
          <p>{result.reasoning}</p>
        </section>
      )}
    </div>
  )
}
