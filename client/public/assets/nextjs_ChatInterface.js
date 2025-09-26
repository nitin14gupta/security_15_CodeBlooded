// ChatInterface.js - Main chat component for AI Companion
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user, token } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/chat/message',
        {
          message: inputMessage,
          conversation_id: conversationId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiMessage = {
        id: Date.now() + 1,
        text: response.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        processingTime: response.data.processing_time
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }

    } catch (err) {
      console.error('Chat error:', err);

      let errorMessage = 'Sorry, something went wrong.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;

        // Handle specific guardrail violations
        if (err.response.data.details) {
          errorMessage += ' Details: ' + err.response.data.details.join(', ');
        }

        if (err.response.data.suggestions) {
          errorMessage += ' Suggestions: ' + err.response.data.suggestions.join(', ');
        }
      }

      const errorMsg = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: 'system',
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMsg]);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>AI Companion</h2>
        <div className="chat-controls">
          <span className="user-info">Welcome, {user?.username}</span>
          <button onClick={clearChat} className="clear-btn">Clear Chat</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              <span className="message-text">{message.text}</span>
              <span className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.processingTime && (
                  <span className="processing-time">
                    ({message.processingTime}s)
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message ai loading">
            <div className="message-content">
              <span className="typing-indicator">AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="input-form">
        <div className="input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            maxLength={1000}
            className="message-input"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="send-btn"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="input-info">
          <span className="char-count">{inputMessage.length}/1000</span>
          {error && <span className="error-text">⚠️ {error}</span>}
        </div>
      </form>

      <style jsx>{`
        .chat-interface {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f8f9fa;
          border-bottom: 1px solid #ddd;
        }

        .chat-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          font-size: 0.9rem;
          color: #666;
        }

        .clear-btn {
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message {
          display: flex;
          max-width: 70%;
        }

        .message.user {
          align-self: flex-end;
        }

        .message.ai {
          align-self: flex-start;
        }

        .message.system {
          align-self: center;
          max-width: 90%;
        }

        .message-content {
          padding: 0.75rem;
          border-radius: 8px;
          position: relative;
        }

        .message.user .message-content {
          background: #007bff;
          color: white;
        }

        .message.ai .message-content {
          background: #e9ecef;
          color: #333;
        }

        .message.system .message-content {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .message.error .message-content {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message-text {
          display: block;
          margin-bottom: 0.25rem;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .processing-time {
          font-style: italic;
          margin-left: 0.5rem;
        }

        .typing-indicator {
          font-style: italic;
          opacity: 0.8;
        }

        .input-form {
          padding: 1rem;
          border-top: 1px solid #ddd;
          background: white;
        }

        .input-container {
          display: flex;
          gap: 0.5rem;
        }

        .message-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .message-input:focus {
          outline: none;
          border-color: #007bff;
        }

        .send-btn {
          padding: 0.75rem 1.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .input-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }

        .char-count {
          color: #666;
        }

        .error-text {
          color: #dc3545;
        }

        .loading .message-content {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;