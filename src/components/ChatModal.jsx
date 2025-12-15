import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, subscribeToMessages } from '../services/dataService';

export default function ChatModal({ booking, currentUser, onClose }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeToMessages(booking.id, (msgs) => {
            setMessages(msgs);
            // Scroll to bottom on new message
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return () => unsubscribe();
    }, [booking.id]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage({
                bookingId: booking.id,
                text: newMessage,
                senderId: currentUser.uid,
                senderEmail: currentUser.email
            });
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md h-[500px] rounded-2xl shadow-2xl flex flex-col pt-0 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="bg-primary p-4 text-white flex justify-between items-center shadow-md">
                    <div>
                        <h3 className="font-bold text-lg">{booking.serviceTitle}</h3>
                        <p className="text-xs opacity-90">Booking #{booking.id.slice(0, 6)}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="text-center text-muted text-sm my-10">
                            <p>No messages yet.</p>
                            <p>Start the conversation!</p>
                        </div>
                    )}
                    {messages.map(msg => {
                        const isMe = msg.senderId === currentUser.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe
                                        ? 'bg-primary text-white rounded-br-none'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                    }`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input
                        type="text"
                        className="input flex-1 rounded-full bg-slate-100 border-none focus:ring-1 focus:ring-primary"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="btn btn-primary rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-sm disabled:opacity-50 disabled:shadow-none"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}
