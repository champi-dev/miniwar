import { useState, useEffect, useRef } from 'react';
import { emitChatMessage, onChatMessage } from '../utils/socket';

export default function Chat({ isLocked }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Listen for chat messages
    const unsubscribe = onChatMessage(({ username, message, timestamp }) => {
      setMessages((prev) => {
        const newMessages = [...prev, { username, message, timestamp }];
        // Keep only last 10 messages
        return newMessages.slice(-10);
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Scroll to bottom when new message arrives
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Press T to open chat (only when pointer is locked)
      if (e.code === 'KeyT' && isLocked && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        // Unlock pointer for typing
        document.exitPointerLock();
      }

      // Press Escape to close chat
      if (e.code === 'Escape' && isOpen) {
        setIsOpen(false);
        setInputValue('');
      }

      // Press Enter to send message
      if (e.code === 'Enter' && isOpen && inputValue.trim()) {
        emitChatMessage(inputValue);
        setInputValue('');
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isOpen, inputValue]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div style={{
      position: 'absolute',
      bottom: isOpen ? 120 : 20,
      left: 20,
      width: '400px',
      maxHeight: '300px',
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'bottom 0.2s ease'
    }}>
      {/* Messages list */}
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '5px',
        padding: '10px',
        marginBottom: '10px',
        maxHeight: '250px',
        overflowY: 'auto',
        opacity: messages.length > 0 ? 1 : 0,
        transition: 'opacity 0.2s ease'
      }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '13px',
              marginBottom: '5px',
              wordWrap: 'break-word'
            }}
          >
            <span style={{ color: '#4A90E2', fontWeight: 'bold' }}>
              {msg.username}
            </span>
            {': '}
            <span>{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input field */}
      {isOpen && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type message... (Enter to send, Esc to cancel)"
          maxLength={100}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '5px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '13px',
            outline: 'none'
          }}
        />
      )}

      {/* Hint text when not open */}
      {!isOpen && isLocked && (
        <div style={{
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '11px',
          opacity: 0.5,
          pointerEvents: 'none'
        }}>
          Press T to chat
        </div>
      )}
    </div>
  );
}
