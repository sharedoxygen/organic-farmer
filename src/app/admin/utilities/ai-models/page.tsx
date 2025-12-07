'use client';

import { useEffect, useState } from 'react';
import { useTenant } from '@/components/TenantProvider';
import styles from './page.module.css';

interface AIConfig {
    reasoningModel: string;
    visionModel: string;
    textModel: string;
}

const DEFAULT_CONFIG: AIConfig = {
    reasoningModel: 'deepseek-r1:latest',
    visionModel: 'qwen3:latest',
    textModel: 'gemma3:27b'
};

export default function AIModelsAdminPage() {
    const { currentFarm } = useTenant();
    const [models, setModels] = useState<string[]>([]);
    const [config, setConfig] = useState<AIConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [pulling, setPulling] = useState<string | null>(null);
    const [message, setMessage] = useState<string>('');
    const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
    const [newModelName, setNewModelName] = useState('');

    const getHeaders = (): HeadersInit => {
        // Use currentFarm from TenantProvider, fallback to localStorage keys
        const farmId = currentFarm?.id ||
            (typeof window !== 'undefined' ? (localStorage.getItem('ofms_current_farm') || localStorage.getItem('ofms_farm_id') || '') : '');
        const headers: Record<string, string> = { 'X-Farm-ID': farmId };
        // Auth is handled via cookies (ofms_session), but add header fallback
        const user = typeof window !== 'undefined' ? localStorage.getItem('ofms_user') : null;
        if (user) {
            try {
                const u = JSON.parse(user);
                if (u?.id) headers['Authorization'] = `Bearer ${u.id}`;
            } catch { }
        }
        return headers;
    };

    const load = async () => {
        setLoading(true);
        setOllamaStatus('checking');
        try {
            const [modelsRes, cfgRes] = await Promise.all([
                fetch('/api/ai/models', { headers: getHeaders(), credentials: 'include' }),
                fetch('/api/ai/models/config', { headers: getHeaders(), credentials: 'include' }),
            ]);
            const modelsJson = await modelsRes.json();
            const cfgJson = await cfgRes.json();

            const fetchedModels = modelsJson.models || [];
            setModels(fetchedModels);
            setOllamaStatus(fetchedModels.length > 0 ? 'connected' : 'disconnected');

            // Use saved config or defaults
            const savedConfig = cfgJson.config;
            if (savedConfig) {
                setConfig(savedConfig);
            } else {
                setConfig(DEFAULT_CONFIG);
            }
        } catch (error) {
            console.error('Failed to load:', error);
            setOllamaStatus('disconnected');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const pullModel = async (name: string) => {
        if (!name.trim()) return;
        setPulling(name);
        setMessage('');
        try {
            const res = await fetch('/api/ai/models', { method: 'POST', headers: { ...getHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }) });
            const json = await res.json();
            setMessage(json.success ? `Pulled ${name}` : `Failed to pull ${name}`);
            await load();
        } finally {
            setPulling(null);
            setNewModelName('');
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

    // Build options list: include current config values even if not in models list
    const getModelOptions = (currentValue: string) => {
        const allOptions = new Set([...models]);
        if (currentValue && !allOptions.has(currentValue)) {
            allOptions.add(currentValue);
        }
        return Array.from(allOptions).sort();
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>AI Models Administration</h1>
            <p className={styles.subtitle}>Manage Ollama models and per-farm configuration</p>

            {/* Connection Status */}
            <div className={styles.statusBar}>
                <span className={`${styles.statusIndicator} ${styles[ollamaStatus]}`}>
                    {ollamaStatus === 'checking' && '⏳ Checking Ollama...'}
                    {ollamaStatus === 'connected' && '✅ Ollama Connected'}
                    {ollamaStatus === 'disconnected' && '❌ Ollama Disconnected'}
                </span>
                <button className={styles.refreshButton} onClick={load} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {message && <div className={styles.message}>{message}</div>}

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3>Available Models</h3>
                    {ollamaStatus === 'disconnected' && (
                        <div className={styles.warning}>
                            <p>Ollama is not running. Start Ollama to see available models.</p>
                            <code>ollama serve</code>
                        </div>
                    )}
                    {models.length > 0 ? (
                        <ul className={styles.modelList}>
                            {models.map(m => (
                                <li key={m} className={styles.modelItem}>
                                    <span>{m}</span>
                                    <button className={styles.pullButton} onClick={() => pullModel(m)} disabled={pulling === m}>
                                        {pulling === m ? 'Pulling...' : 'Pull'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : ollamaStatus === 'connected' ? (
                        <p className={styles.emptyState}>No models installed. Pull a model below.</p>
                    ) : null}

                    {/* Manual model pull */}
                    <div className={styles.pullNewModel}>
                        <input
                            type="text"
                            placeholder="Model name (e.g., llama3:8b)"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && pullModel(newModelName)}
                        />
                        <button
                            className={styles.pullButton}
                            onClick={() => pullModel(newModelName)}
                            disabled={!newModelName.trim() || pulling !== null}
                        >
                            {pulling === newModelName ? 'Pulling...' : 'Pull Model'}
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3>Active Configuration</h3>
                    <div className={styles.formRow}>
                        <label>Reasoning Model</label>
                        <select
                            value={config.reasoningModel}
                            onChange={(e) => setConfig({ ...config, reasoningModel: e.target.value })}
                        >
                            {getModelOptions(config.reasoningModel).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <label>Vision Model</label>
                        <select
                            value={config.visionModel}
                            onChange={(e) => setConfig({ ...config, visionModel: e.target.value })}
                        >
                            {getModelOptions(config.visionModel).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.formRow}>
                        <label>Text Model</label>
                        <select
                            value={config.textModel}
                            onChange={(e) => setConfig({ ...config, textModel: e.target.value })}
                        >
                            {getModelOptions(config.textModel).map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <button className={styles.saveButton} onClick={saveConfig}>Save Configuration</button>
                </div>
            </div>
        </div>
    );
}



