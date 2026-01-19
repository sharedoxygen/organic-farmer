'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AIComponents.module.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface FarmAssistantChatProps {
    farmId: string;
    farmName: string;
    location?: string;
    onClose?: () => void;
}

export function FarmAssistantChat({ farmId, farmName, location = 'New York, NY' }: FarmAssistantChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: `👋 Hello! I'm your OFMS Farm Assistant for ${farmName}. How can I help you today?`,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quickReplies, setQuickReplies] = useState([
        "How's my farm doing?",
        "Weather forecast",
        "Active batches",
        "Any alerts?"
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Farm-ID': farmId
                },
                body: JSON.stringify({
                    message: messageText,
                    farmName,
                    location,
                    conversationHistory: messages
                })
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: data.response.message,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);

                if (data.response.quickReplies) {
                    setQuickReplies(data.response.quickReplies);
                }
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleQuickReply = (reply: string) => {
        sendMessage(reply);
    };

    return (
        <div className={styles.chatContainer}>
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.chatHeader}>
                        <div className={styles.chatAvatar}>🤖</div>
                        <div className={styles.chatHeaderInfo}>
                            <h3>Farm Assistant</h3>
                            <p>{isLoading ? 'Thinking...' : 'Online'}</p>
                        </div>
                    </div>

                    <div className={styles.chatMessages}>
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`${styles.message} ${message.role === 'user' ? styles.messageUser : styles.messageAssistant
                                    }`}
                            >
                                <div dangerouslySetInnerHTML={{
                                    __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')
                                }} />
                                <div className={styles.messageTime}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.messageAssistant}`}>
                                <div className={styles.pulseAnimation}>Thinking...</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.quickReplies}>
                        {quickReplies.map((reply, index) => (
                            <button
                                key={index}
                                className={styles.quickReply}
                                onClick={() => handleQuickReply(reply)}
                                disabled={isLoading}
                            >
                                {reply}
                            </button>
                        ))}
                    </div>

                    <form className={styles.chatInput} onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about your farm..."
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            )}

            <button
                className={`${styles.chatToggle} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? '✕' : '🤖'}
            </button>
        </div>
    );
}
