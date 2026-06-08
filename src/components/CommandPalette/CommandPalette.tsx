'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/components/TenantProvider';
import styles from './CommandPalette.module.css';

interface Command {
    id: string;
    label: string;
    hint?: string;
    href?: string;
    action?: () => void;
    keywords?: string[];
}

const BASE_COMMANDS: Command[] = [
    { id: 'mission', label: 'Mission Control', hint: 'Showcase dashboard', href: '/mission-control', keywords: ['home', 'dashboard', 'control'] },
    { id: 'ai', label: 'AI Command Center', hint: 'Agentic insights', href: '/ai-dashboard', keywords: ['ai', 'agent', 'ml'] },
    { id: 'plant-scan', label: 'Plant Vision Scan', hint: 'Camera + AI plant analysis', href: '/mobile/plant-scan', keywords: ['camera', 'photo', 'disease', 'plant', 'mobile', 'field'] },
    { id: 'obs', label: 'Observability Hub', hint: 'Metrics & audit', href: '/observability', keywords: ['metrics', 'telemetry', 'logs'] },
    { id: 'ops', label: 'Operations Center', hint: 'Run CLI utilities from UI', href: '/admin/operations', keywords: ['cli', 'scripts', 'verify', 'seed', 'operations', 'utilities'] },
    { id: 'batches', label: 'Batch Management', href: '/production/batches', keywords: ['production', 'grow'] },
    { id: 'trace', label: 'Seed-to-Sale Traceability', href: '/traceability/seed-to-sale', keywords: ['lot', 'custody', 'compliance'] },
    { id: 'orders', label: 'Sales Orders', href: '/sales/orders', keywords: ['sales', 'delivery'] },
    { id: 'calendar', label: 'Production Calendar', href: '/planning/calendar', keywords: ['schedule', 'plan'] },
    { id: 'quality', label: 'Quality Control', href: '/quality/control', keywords: ['qc', 'inspection'] },
    { id: 'settings', label: 'Settings', href: '/settings', keywords: ['admin', 'config'] },
];

export function CommandPalette() {
    const router = useRouter();
    const { currentFarm, availableFarms, switchFarm } = useTenant();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(0);

    const farmCommands: Command[] = availableFarms
        .filter((f) => f.id !== currentFarm?.id)
        .map((f) => ({
            id: `farm-${f.id}`,
            label: `Switch to ${f.farm_name}`,
            hint: 'Change farm context',
            action: () => void switchFarm(f.id),
            keywords: ['farm', 'tenant', f.farm_name.toLowerCase()],
        }));

    const allCommands = [...BASE_COMMANDS, ...farmCommands];

    const filtered = query.trim()
        ? allCommands.filter((c) => {
            const q = query.toLowerCase();
            return (
                c.label.toLowerCase().includes(q) ||
                c.hint?.toLowerCase().includes(q) ||
                c.keywords?.some((k) => k.includes(q))
            );
        })
        : allCommands;

    const execute = useCallback(
        (cmd: Command) => {
            setOpen(false);
            setQuery('');
            if (cmd.action) cmd.action();
            else if (cmd.href) router.push(cmd.href);
        },
        [router]
    );

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((v) => !v);
                setSelected(0);
            }
            if (!open) return;
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
            }
            if (e.key === 'Enter' && filtered[selected]) {
                e.preventDefault();
                execute(filtered[selected]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, filtered, selected, execute]);

    if (!open) return null;

    return (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
            <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
                <input
                    className={styles.input}
                    placeholder="Type a command or search… (⌘K)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setSelected(0);
                    }}
                    autoFocus
                />
                <ul className={styles.list}>
                    {filtered.map((cmd, i) => (
                        <li key={cmd.id}>
                            <button
                                type="button"
                                className={i === selected ? styles.selected : ''}
                                onClick={() => execute(cmd)}
                                onMouseEnter={() => setSelected(i)}
                            >
                                <span>{cmd.label}</span>
                                {cmd.hint && <small>{cmd.hint}</small>}
                            </button>
                        </li>
                    ))}
                    {filtered.length === 0 && <li className={styles.empty}>No matches</li>}
                </ul>
                <footer className={styles.footer}>
                    <span>↑↓ navigate</span>
                    <span>↵ select</span>
                    <span>esc close</span>
                </footer>
            </div>
        </div>
    );
}
