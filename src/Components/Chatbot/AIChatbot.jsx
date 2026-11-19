import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedCity } from "../../utils/userStorage";
import botAvatar from "../../assets/showbot_avatar.jpg";
import "./AIChatbot.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const INITIAL_SUGGESTIONS = [
  "🎬 Trending Movies",
  "🎟️ Active Discount Coupons",
  "🍿 How to book seats?",
  "📍 Cinemas near me",
  "🎸 Live Concerts & Shows",
];

// Offline fallback knowledge if backend is unreachable
const OFFLINE_OFFERS = [
  {
    code: "FESTIVE25",
    title: "Festive Dhamaka Offer",
    discount: "25% OFF",
    maxDiscount: "Up to ₹150",
    description: "Save 25% across all movies, live events and sports bookings.",
  },
  {
    code: "LASTMIN100",
    title: "Last Minute Movie Rush",
    discount: "₹100 FLAT OFF",
    maxDiscount: "Flat ₹100",
    description: "Instant ₹100 discount on cinema tickets booked for today.",
  },
  {
    code: "WEEKEND50",
    title: "Weekend Blockbuster Deal",
    discount: "20% OFF",
    maxDiscount: "Up to ₹100",
    description: "Special savings on Saturday & Sunday cinema showtimes.",
  },
  {
    code: "WELCOME50",
    title: "New User Welcome Bonus",
    discount: "₹50 FLAT OFF",
    maxDiscount: "Flat ₹50",
    description: "Flat ₹50 off on your very first booking on BookMyShow.",
  },
];

const OFFLINE_MOVIES = [
  {
    id: "m1",
    title: "Spider-Man: No Way Home",
    poster: "/src/assets/poster.png",
    rating: 8.4,
    genre: "Action, Sci-Fi",
    language: "English, Hindi",
    format: "3D / IMAX",
    url: "/movies",
  },
  {
    id: "m2",
    title: "Naadi Dosh",
    poster: "/src/assets/poster1.jpg",
    rating: 8.2,
    genre: "Romance, Drama",
    language: "Gujarati",
    format: "2D",
    url: "/movies",
  },
  {
    id: "m3",
    title: "Dhurandhar",
    poster: "/src/assets/poster2.jpg",
    rating: 7.9,
    genre: "Action, Thriller",
    language: "Gujarati",
    format: "2D",
    url: "/movies",
  },
  {
    id: "m4",
    title: "Animal",
    poster: "/src/assets/poster4.jpg",
    rating: 8.1,
    genre: "Action, Crime",
    language: "Hindi",
    format: "2D",
    url: "/movies",
  },
];

export default function AIChatbot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [city, setCity] = useState(() => getSelectedCity() || "Ahmedabad");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "bot",
      text: "Hello! 👋 I'm **ShowBot**, your AI Entertainment Guide for BookMyShow. How can I help you today?",
      suggestions: INITIAL_SUGGESTIONS,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Keep city in sync
  useEffect(() => {
    const handleCityUpdate = (e) => {
      setCity(e?.detail || getSelectedCity() || "Ahmedabad");
    };
    window.addEventListener("cityUpdated", handleCityUpdate);
    return () => window.removeEventListener("cityUpdated", handleCityUpdate);
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Gentle audio chime
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  // Speech Recognition (Web Speech API)
  const toggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          sendMessage(transcript);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Handle Copy Coupon Code
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Local fallback responder if server is unreachable
  const getOfflineResponse = (query) => {
    const q = query.toLowerCase();

    if (q.includes("offer") || q.includes("coupon") || q.includes("discount") || q.includes("code")) {
      return {
        reply: "Here are current discount promo codes you can use right now on BookMyShow:",
        intent: "offers",
        offers: OFFLINE_OFFERS,
        suggestions: ["How to book seats?", "Trending Movies", "Live Concerts"],
      };
    }

    if (q.includes("how to book") || q.includes("seat") || q.includes("booking") || q.includes("step")) {
      return {
        reply: `Booking your tickets is seamless!
1. 🎬 **Pick a Movie/Event:** Select what you want to watch.
2. 📍 **Select Cinema & Time:** Choose your theatre and showtime.
3. 💺 **Select Seats:** Click and pick Silver, Gold, or Platinum/Recliner seats.
4. 🎟️ **Apply Coupon:** Enter coupon code like **FESTIVE25** to save!
5. 💳 **Instant Checkout:** Complete payment via UPI, Card, or Net Banking.
6. 📲 **E-Ticket Delivered:** Instant QR-code ticket displayed and emailed!`,
        intent: "guide",
        actions: [
          { label: "Browse All Movies", url: "/movies" },
          { label: "View Active Offers", url: "/offers" },
        ],
        suggestions: ["Active Discount Coupons", "Top Movies", "Cinemas near me"],
      };
    }

    if (q.includes("cinema") || q.includes("theatre") || q.includes("pvr") || q.includes("inox")) {
      return {
        reply: `Popular partner cinemas in **${city}**:
• **PVR INOX**: Acropolis Mall, S.G. Highway
• **Cinepolis Cinemas**: Ahmedabad One Mall
• **INOX Megaplex**: Himalaya Mall
• **Miraj Cinemas**: City Gold Screen`,
        intent: "cinemas",
        actions: [{ label: "View Showtimes", url: "/movies" }],
        suggestions: ["Trending Movies", "Active Offers", "Live Concerts"],
      };
    }

    // Default movie suggestions
    return {
      reply: `Here are popular trending movies playing in theatres right now:`,
      intent: "movies",
      items: OFFLINE_MOVIES,
      actions: [{ label: "View All Movies", url: "/movies" }],
      suggestions: ["Active Discount Coupons", "How to book seats?", "Live Concerts"],
    };
  };

  // Send Message
  const sendMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : inputMessage).trim();
    if (!textToSend || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        sender: "user",
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ];

    setMessages(newMessages);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Call backend AI endpoint
      const response = await fetch(`${API_BASE_URL}/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          city: city,
          history: messages.slice(-6).map((m) => ({ role: m.sender, content: m.text })),
        }),
      });

      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        data = getOfflineResponse(textToSend);
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "I'm here to help with all your movie and event booking needs!",
        items: data.items || [],
        offers: data.offers || [],
        cinemas: data.cinemas || [],
        actions: data.actions || [],
        suggestions: data.suggestions || INITIAL_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      playChime();

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch {
      // Network/Offline fallback
      const data = getOfflineResponse(textToSend);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.reply,
        items: data.items || [],
        offers: data.offers || [],
        cinemas: data.cinemas || [],
        actions: data.actions || [],
        suggestions: data.suggestions || INITIAL_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
      playChime();
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: `Chat cleared! What would you like to explore in **${city}**?`,
        suggestions: INITIAL_SUGGESTIONS,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="bms-ai-chatbot-root">
      {/* Floating Tooltip Callout */}
      {showTooltip && !isOpen && (
        <div className="bms-ai-tooltip" onClick={() => setIsOpen(true)}>
          <div className="bms-ai-tooltip-content">
            <span className="bms-ai-tooltip-badge">✨ ShowBot AI</span>
            <p>Need movie recommendations or discount codes in <strong>{city}</strong>?</p>
          </div>
          <button
            type="button"
            className="bms-ai-tooltip-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
            }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* Floating Action Launcher Button */}
      <button
        type="button"
        id="bms-ai-chatbot-launcher"
        className={`bms-ai-launcher-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle BookMyShow AI Chatbot"
        title={isOpen ? "Close ShowBot AI" : "Chat with ShowBot AI"}
      >
        <div className="bms-ai-launcher-pulse"></div>
        {isOpen ? (
          <svg className="bms-ai-close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <div className="bms-ai-launcher-inner">
            <img src={botAvatar} alt="ShowBot AI" className="bms-ai-launcher-avatar" />
            <span className="bms-ai-sparkle-dot"></span>
          </div>
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="bms-ai-unread-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="bms-ai-chat-window" role="dialog" aria-labelledby="showbot-title">
          {/* Header */}
          <div className="bms-ai-header">
            <div className="bms-ai-header-bot">
              <div className="bms-ai-avatar-wrapper">
                <img src={botAvatar} alt="ShowBot Avatar" className="bms-ai-header-avatar" />
                <span className="bms-ai-status-indicator" title="ShowBot Online"></span>
              </div>
              <div className="bms-ai-header-info">
                <div className="bms-ai-title-row">
                  <h3 id="showbot-title">ShowBot AI</h3>
                  <span className="bms-ai-verified-tag">PRO</span>
                </div>
                <p className="bms-ai-subtitle">
                    24/7 Entertainment Guide
                </p>
              </div>
            </div>

            <div className="bms-ai-header-controls">
              {/* Sound Toggle */}
             

              {/* Reset/Clear Chat */}
              <button
                type="button"
                className="bms-ai-header-btn"
                onClick={clearChat}
                title="Clear conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
              </button>

              {/* Close Button */}
              <button
                type="button"
                className="bms-ai-header-btn close"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="bms-ai-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`bms-ai-msg-row ${msg.sender}`}>
                {msg.sender === "bot" && (
                  <img src={botAvatar} alt="Bot" className="bms-ai-msg-avatar" />
                )}

                <div className="bms-ai-msg-bubble-container">
                  <div className="bms-ai-msg-bubble">
                    {/* Render message with basic bold & line break formatting */}
                    <div className="bms-ai-msg-text">
                      {msg.text.split("\n").map((line, i) => (
                        <p key={i}>
                          {line.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      ))}
                    </div>

                    {/* Rich Movie / Entertainment Cards */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="bms-ai-cards-grid">
                        {msg.items.map((item, itmIdx) => (
                          <div key={itmIdx} className="bms-ai-card">
                            {item.poster && (
                              <img
                                src={item.poster}
                                alt={item.title}
                                className="bms-ai-card-img"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            <div className="bms-ai-card-details">
                              <h4 className="bms-ai-card-title">{item.title}</h4>
                              <div className="bms-ai-card-meta">
                                {item.rating && (
                                  <span className="bms-ai-card-rating">
                                    ★ {item.rating}
                                  </span>
                                )}
                                {item.format && (
                                  <span className="bms-ai-card-tag">{item.format}</span>
                                )}
                                {item.genre && (
                                  <span className="bms-ai-card-genre">{item.genre}</span>
                                )}
                              </div>
                              {item.price && (
                                <p className="bms-ai-card-price">From ₹{item.price}</p>
                              )}
                              <button
                                type="button"
                                className="bms-ai-card-btn"
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(item.url || "/movies");
                                }}
                              >
                                Book Now →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rich Discount Coupon Cards */}
                    {msg.offers && msg.offers.length > 0 && (
                      <div className="bms-ai-offers-list">
                        {msg.offers.map((offer, offIdx) => (
                          <div key={offIdx} className="bms-ai-offer-card">
                            <div className="bms-ai-offer-badge">{offer.discount}</div>
                            <div className="bms-ai-offer-info">
                              <strong>{offer.title}</strong>
                              <p>{offer.description}</p>
                              <div className="bms-ai-coupon-row">
                                <span className="bms-ai-coupon-code">{offer.code}</span>
                                <button
                                  type="button"
                                  className={`bms-ai-copy-btn ${copiedCode === offer.code ? "copied" : ""}`}
                                  onClick={() => handleCopyCode(offer.code)}
                                >
                                  {copiedCode === offer.code ? "✓ Copied" : "Copy"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Cinemas List */}
                    {msg.cinemas && msg.cinemas.length > 0 && (
                      <div className="bms-ai-cinemas-list">
                        {msg.cinemas.map((cinema, cIdx) => (
                          <div key={cIdx} className="bms-ai-cinema-item">
                            <span className="bms-ai-cinema-icon">🏢</span>
                            <div>
                              <strong>{cinema.name}</strong>
                              <p>{cinema.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action navigation buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="bms-ai-actions-row">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            className="bms-ai-action-btn"
                            onClick={() => {
                              setIsOpen(false);
                              navigate(act.url);
                            }}
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="bms-ai-timestamp">{msg.timestamp}</span>
                  </div>

                  {/* Quick Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="bms-ai-chips-container">
                      {msg.suggestions.map((chip, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          className="bms-ai-chip"
                          onClick={() => sendMessage(chip.replace(/^[^\w\s]+\s*/, ""))}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="bms-ai-msg-row bot">
                <img src={botAvatar} alt="Bot" className="bms-ai-msg-avatar" />
                <div className="bms-ai-typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                  <small>ShowBot is thinking...</small>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="bms-ai-footer">
            <div className="bms-ai-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="bms-ai-input"
                placeholder={`Ask about movies, offers in ${city}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
              />

              {/* Voice recognition button */}
              <button
                type="button"
                className={`bms-ai-voice-btn ${isListening ? "listening" : ""}`}
                onClick={toggleSpeech}
                title={isListening ? "Listening... click to stop" : "Voice search"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>

              {/* Send Button */}
              <button
                type="button"
                className="bms-ai-send-btn"
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                title="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="bms-ai-disclaimer">
              ⚡ Powered by BookMyShow AI Concierge
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
