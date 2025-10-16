'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface AIConfig {
    reasoningModel: string;
    visionModel: string;
    textModel: string;
}

export default function AIModelsAdminPage() {
    const [models, setModels] = useState<string[]>([]);
    const [config, setConfig] = useState<AIConfig>({ reasoningModel: '', visionModel: '', textModel: '' });
    const [loading, setLoading] = useState(true);
    const [pulling, setPulling] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');

    const getHeaders = (): HeadersInit => {
        const farmId = typeof window !== 'undefined' ? (localStorage.getItem('ofms_farm_id') || '') : '';
        const user = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
        const headers: Record<string, string> = { 'X-Farm-ID': farmId };
        if (user) {
            const u = JSON.parse(user);
            if (u?.id) headers['Authorization'] = `Bearer ${u.id}`;
        }
        return headers;
    };

    const load = async () => {
        setLoading(true);
        try {
            const [modelsRes, cfgRes] = await Promise.all([
                fetch('/api/ai/models', { headers: getHeaders() }),
                fetch('/api/ai/models/config', { headers: getHeaders() }),
            ]);
            const modelsJson = await modelsRes.json();
            const cfgJson = await cfgRes.json();
            setModels(modelsJson.models || []);
            setConfig(cfgJson.config || { reasoningModel: 'deepseek-r1:latest', visionModel: 'qwen3:latest', textModel: 'gemma3:27b' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const pullModel = async (name: string) => {
        setPulling(name);
        setMessage('');
        try {
            const res = await fetch('/api/ai/models', { method: 'POST', headers: { ...getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            const json = await res.json();
            setMessage(json.success ? `Pulled ${name}` : `Failed to pull ${name}`);
            await load();
        } finally {
            setPulling(null);
        }
    };

    const saveConfig = async () => {
        setMessage('');
        try {
            console.log('💾 Attempting to save config:', config);
            const headers = getHeaders();
            console.log('🔑 Request headers:', headers);

            const res = await fetch('/api/ai/models/config', {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const json = await res.json();
            console.log('📥 Save response:', json);

            if (json.success) {
                setMessage('Configuration saved');
            } else {
                setMessage(`Failed to save: ${json.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('❌ Error saving config:', error);
            setMessage('Failed to save configuration: Network error');
        }
    };

    if (loading) return <div className={styles.container}><p>Loading AI models…</p></div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>AI Models Administration</h1>
            <p className={styles.subtitle}>Manage Ollama models and per‑farm configuration</p>

            {message && <div className={styles.message}>{message}</div>}

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Available Models</h3>
                    <ul className={styles.modelList}>
                        {models.map(m => (
                            <li key={m} className={styles.modelItem}>
                                <span>{m}</span>
                                <button className={styles.pullButton} onClick={() => pullModel(m)} disabled={pulling === m}>
                                    {pulling === m ? 'Pulling…' : 'Pull'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={styles.card}>
                    <h3>Active Configuration</h3>
                    <div className={styles.formRow}>
                        <label>Reasoning Model</label>
                        <select value={config.reasoningModel} onChange={(e) => setConfig({ ...config, reasoningModel: e.target.value })}>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <label>Vision Model</label>
                        <select value={config.visionModel} onChange={(e) => setConfig({ ...config, visionModel: e.target.value })}>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <label>Text Model</label>
                        <select value={config.textModel} onChange={(e) => setConfig({ ...config, textModel: e.target.value })}>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button className={styles.saveButton} onClick={saveConfig}>Save Configuration</button>
                </div>
            </div>
        </div>
    );
}



