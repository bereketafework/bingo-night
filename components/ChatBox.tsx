
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    selfName: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, selfName }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t, t_str } = useLanguage();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="bg-gray-900/50 border border-gray-700/50 backdrop-blur-sm rounded-2xl shadow-lg p-4 flex flex-col h-full min-h-[20rem] lg:min-h-0">
            <h3 className="text-lg font-bold text-white mb-3 font-inter border-b border-gray-700 pb-2">{t('chat_title')}</h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === selfName ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-xs md:max-w-sm ${msg.sender === selfName ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                            <p className="font-bold text-sm">{msg.sender}</p>
                            <p className="text-base break-words">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t_str('chat_placeholder')}
                    className="flex-grow w-full px-3 py-2 text-white bg-gray-700/80 border border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
                <button type="submit" className="px-4 py-2 font-semibold text-gray-900 bg-amber-500 rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {t('chat_send')}
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
