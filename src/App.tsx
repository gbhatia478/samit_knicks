import { useState, useEffect, useRef } from 'react';
import './App.css';

interface Message {
  sender: string;
  text: string;
  isOutgoing: boolean;
  isSamit?: boolean;
}

const IMESSAGE_SCRIPT: Message[] = [
  { sender: "Chris Stone", text: "Yo, has anyone seen Samit? Did he lock himself in his room after the Knicks game last night?", isOutgoing: false },
  { sender: "Arvind", text: "Probably still trying to calculate their playoff odds using a slide rule. He thinks they are going to trade for Giannis.", isOutgoing: false },
  { sender: "Gaurav", text: "Brunson is a beast but Samit expects him to play 48 minutes a game and score 60 points on 90% shooting.", isOutgoing: true },
  { sender: "Samit Mustafa", text: "Bro! Brunson is MVP! We are literally one trade away from a championship! Sleep on us all you want!", isOutgoing: false, isSamit: true },
  { sender: "Chris Stone", text: "Samit, the Knicks last won a championship in 1973. My dad was in middle school.", isOutgoing: false },
  { sender: "Arvind", text: "History class is that way, Samit. Modern basketball is a different story.", isOutgoing: false },
  { sender: "Samit Mustafa", text: "1973 is still history! Brunson is carrying! And Thibs' defensive schemes are elite. We are lock down!", isOutgoing: false, isSamit: true },
  { sender: "Gaurav", text: "Thibs is going to play Brunson until his legs turn to dust, Samit.", isOutgoing: true },
  { sender: "Samit Mustafa", text: "No way bro! He is built different. Next year we are getting Jokic. The trade machine said it works.", isOutgoing: false, isSamit: true },
  { sender: "Chris Stone", text: "Jokic for a 2032 second rounder and some bagels? Sure, Denver is jumping on that.", isOutgoing: false }
];

const SAMIT_EXCUSES = [
  "Brunson was playing with a hangnail. It completely threw off his shooting mechanics.",
  "If Julius Randle didn't miss that one layup in the 2nd quarter of game 3, we would've swept them.",
  "It was a back-to-back game on a Tuesday. Nobody wins those.",
  "The refs were clearly paid off by the Heat/Celtics/Pacers.",
  "We are just conserving energy for the playoffs anyway.",
  "The court was too slippery, New York humidity is different.",
  "It is a rebuilding century. Just trust the process.",
  "The NBA scriptwriters hate New York, it's a media conspiracy.",
  "OG Anunoby's hamstring was only at 98.4% capacity. Any doctor will tell you that's unplayable.",
  "We didn't lose, we just ran out of time.",
  "It is all part of Leon Rose's master plan for the 2028 draft.",
  "The basketball was inflated to 8.2 PSI instead of 8.5. It's a league-wide scandal.",
  "Tom Thibodeau was resting his voice, so the players couldn't hear the defensive call from 3 feet away."
];

interface TradeAsset {
  name: string;
  value: string;
}

interface TradeOption {
  id: string;
  title: string;
  knicksGet: string;
  knicksGive: TradeAsset[];
  opponentGet: TradeAsset[];
  feasibility: string;
  espnVerdict: string;
  samitConfidence: string;
  passed: boolean;
}

const TRADE_OPTIONS: TradeOption[] = [
  {
    id: "jokic",
    title: "The 'Jokic to New York' Dream",
    knicksGet: "Nikola Jokic (C)",
    knicksGive: [
      { name: "Mitchell Robinson (C)", value: "Slightly used knees" },
      { name: "2031 Second Round Pick", value: "Probably 58th overall" },
      { name: "A bag of authentic NYC bagels", value: "Actually high value" }
    ],
    opponentGet: [
      { name: "Mitchell Robinson (C)", value: "Slightly used knees" },
      { name: "2031 Second Round Pick", value: "Probably 58th overall" },
      { name: "NYC bagels", value: "Actually high value" }
    ],
    feasibility: "0.00001%",
    espnVerdict: "Denver GM has blocked your number and marked your emails as spam.",
    samitConfidence: "100% (It makes sense for both sides!)",
    passed: false
  },
  {
    id: "giannis",
    title: "Giannis for Bench Warmers",
    knicksGet: "Giannis Antetokounmpo (PF)",
    knicksGive: [
      { name: "Miles McBride (PG)", value: "Energizer bunny" },
      { name: "Precious Achiuwa (PF)", value: "High motor" },
      { name: "Two tickets to a Broadway show", value: "Lion King, mezzanine seats" }
    ],
    opponentGet: [
      { name: "Miles McBride (PG)", value: "Energizer bunny" },
      { name: "Precious Achiuwa (PF)", value: "High motor" },
      { name: "Broadway tickets", value: "Lion King" }
    ],
    feasibility: "0.00004%",
    espnVerdict: "Milwaukee GM laughed so hard he choked on his cheese curd.",
    samitConfidence: "95% (They need depth, we need a superstar!)",
    passed: false
  },
  {
    id: "curry",
    title: "Curry Homecoming (Sort of)",
    knicksGet: "Stephen Curry (PG)",
    knicksGive: [
      { name: "Miles McBride (PG)", value: "Defense first" },
      { name: "2028 First Round Pick (Protected 1-29)", value: "Basically a second rounder" }
    ],
    opponentGet: [
      { name: "Miles McBride (PG)", value: "Defense first" },
      { name: "2028 Protected Pick", value: "Basically a second rounder" }
    ],
    feasibility: "0.00000%",
    espnVerdict: "Golden State GM hung up and checked if April Fools was today.",
    samitConfidence: "110% (Curry always wanted to play in MSG!)",
    passed: false
  }
];

function App() {
  const [activeTab, setActiveTab] = useState<string>("imessage");
  
  // Helper to safely track PostHog events
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    const posthog = (window as any).posthog;
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  };

  // Track tab changes
  useEffect(() => {
    trackEvent('tab_changed', { tab: activeTab });
  }, [activeTab]);
  
  // iMessage Simulator state
  const [visibleMessages, setVisibleMessages] = useState<Message[]>(IMESSAGE_SCRIPT.slice(0, 3));
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingSender, setTypingSender] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Counter state
  const [timeLeft, setTimeLeft] = useState({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Excuse generator state
  const [currentExcuse, setCurrentExcuse] = useState<string>(SAMIT_EXCUSES[0]);
  const [excuseAnimate, setExcuseAnimate] = useState<boolean>(false);
  
  // Trade Machine state
  const [selectedTrade, setSelectedTrade] = useState<TradeOption>(TRADE_OPTIONS[0]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<TradeOption | null>(null);
  
  // Refund Form state
  const [refundReason, setRefundReason] = useState<string>("delusion");
  const [copiumLevel, setCopiumLevel] = useState<number>(50);
  const [willingToSwitch, setWillingToSwitch] = useState<boolean>(false);
  const [showRefundPopup, setShowRefundPopup] = useState<boolean>(false);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, isTyping]);

  // Knicks championship counter (May 10, 1973)
  useEffect(() => {
    const championshipDate = new Date('1973-05-10T22:00:00').getTime();
    
    const updateCounter = () => {
      const now = new Date().getTime();
      const diff = now - championshipDate;
      
      const msPerSecond = 1000;
      const msPerMinute = 60 * 1000;
      const msPerHour = 60 * 60 * 1000;
      const msPerDay = 24 * 60 * 60 * 1000;
      const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
      
      const years = Math.floor(diff / msPerYear);
      const days = Math.floor((diff % msPerYear) / msPerDay);
      const hours = Math.floor((diff % msPerDay) / msPerHour);
      const minutes = Math.floor((diff % msPerHour) / msPerMinute);
      const seconds = Math.floor((diff % msPerMinute) / msPerSecond);
      
      setTimeLeft({ years, days, hours, minutes, seconds });
    };
    
    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, []);

  // iMessage progression
  const advanceChat = () => {
    if (isTyping) return;
    const currentLength = visibleMessages.length;
    if (currentLength >= IMESSAGE_SCRIPT.length) {
      // Reset chat
      setVisibleMessages(IMESSAGE_SCRIPT.slice(0, 3));
      trackEvent('imessage_chat_reset');
      return;
    }
    
    const nextMsg = IMESSAGE_SCRIPT[currentLength];
    setIsTyping(true);
    setTypingSender(nextMsg.sender);
    trackEvent('imessage_chat_advanced', { 
      step: currentLength + 1, 
      sender: nextMsg.sender 
    });
    
    setTimeout(() => {
      setIsTyping(false);
      setVisibleMessages(prev => [...prev, nextMsg]);
    }, 1500);
  };

  // Excuse generator click
  const generateNewExcuse = () => {
    setExcuseAnimate(true);
    let nextExcuse;
    do {
      nextExcuse = SAMIT_EXCUSES[Math.floor(Math.random() * SAMIT_EXCUSES.length)];
    } while (nextExcuse === currentExcuse);
    
    trackEvent('excuse_generated', { excuse: nextExcuse });
    
    setTimeout(() => {
      setCurrentExcuse(nextExcuse);
      setExcuseAnimate(false);
    }, 250);
  };

  // Trade analyzer click
  const analyzeTrade = () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    trackEvent('trade_analyzed', { 
      trade_id: selectedTrade.id, 
      trade_title: selectedTrade.title 
    });
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult(selectedTrade);
    }, 2000);
  };

  // Refund Form Submit
  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('refund_form_submitted', {
      reason: refundReason,
      copium_level: copiumLevel,
      willing_to_switch: willingToSwitch
    });
    setShowRefundPopup(true);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="badge-container">
          <span className="badge orange">Knicks Fan Roast</span>
          <span className="badge blue">Copium Detector</span>
        </div>
        <h1 className="app-title">Samit's Knicks Copium Terminal</h1>
        <p className="app-subtitle">
          Analyzing the absolute delusion of our friend Samit, his questionable trading skills, and the 50+ year championship drought of the New York Knicks.
        </p>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button 
          className={`tab-btn ${activeTab === 'imessage' ? 'active' : ''}`}
          onClick={() => setActiveTab('imessage')}
        >
          💬 Chat Dynamic
        </button>
        <button 
          className={`tab-btn ${activeTab === 'counter' ? 'active' : ''}`}
          onClick={() => setActiveTab('counter')}
        >
          ⏳ Drought Counter
        </button>
        <button 
          className={`tab-btn ${activeTab === 'excuse' ? 'active' : ''}`}
          onClick={() => setActiveTab('excuse')}
        >
          🤡 Excuse Generator
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trade' ? 'active' : ''}`}
          onClick={() => setActiveTab('trade')}
        >
          🏀 Trade Machine
        </button>
        <button 
          className={`tab-btn ${activeTab === 'refund' ? 'active' : ''}`}
          onClick={() => setActiveTab('refund')}
        >
          🎟️ Ticket Refund
        </button>
      </nav>

      {/* Tab Content */}
      <main className="tab-content">
        
        {/* Tab 1: iMessage Simulator */}
        {activeTab === 'imessage' && (
          <div className="glass-card">
            <h2 className="card-title">
              <span>💬</span> The Group Chat Dynamic
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              We analyzed the group chat history. While we respect privacy, one thing is abundantly clear: 
              Chris and Arvind love to expose Samit's basketball hot takes, and Samit will defend the Knicks to his grave.
              They even have a secret chat called <strong>&quot;No Samits Allowed&quot;</strong> to talk about his trades in peace.
            </p>
            
            <div className="imessage-container">
              <div className="imessage-header">
                <button className="back-button">
                  ‹ Messages
                </button>
                <div className="imessage-title-area">
                  <span className="imessage-title">Chris, Arvind, Gaurav, Samit</span>
                  <span className="imessage-subtitle">iMessage Group Chat</span>
                </div>
                <div className="info-icon">i</div>
              </div>
              
              <div className="imessage-body">
                {visibleMessages.map((msg, i) => (
                  <div key={i} className={`message-group ${msg.isOutgoing ? 'outgoing' : 'incoming'}`}>
                    <span className="sender-name">
                      {msg.sender} {msg.isSamit ? '🏀' : ''}
                    </span>
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="typing-indicator">
                    <span className="sender-name" style={{ position: 'absolute', top: '-18px', left: '8px' }}>
                      {typingSender} is typing...
                    </span>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="imessage-input-area">
                <div className="input-mock">
                  {visibleMessages.length >= IMESSAGE_SCRIPT.length 
                    ? "Click the button to restart chat..." 
                    : "Wait for the roast to escalate..."}
                </div>
                <button 
                  className="send-mock-btn" 
                  onClick={advanceChat}
                  disabled={isTyping}
                  style={{ opacity: isTyping ? 0.5 : 1 }}
                >
                  {visibleMessages.length >= IMESSAGE_SCRIPT.length ? "🔄" : "➡️"}
                </button>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              *Click the arrow button on the input bar to advance the group chat.
            </p>
          </div>
        )}

        {/* Tab 2: Championship Counter */}
        {activeTab === 'counter' && (
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <h2 className="card-title" style={{ justifyContent: 'center' }}>
              <span>⏳</span> Knicks Joy Drought Counter
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 1.5rem' }}>
              The New York Knicks last won an NBA Championship on <strong>May 10, 1973</strong>. 
              Here is exactly how long Samit has been waiting for another parade.
            </p>
            
            <div className="counter-grid">
              <div className="counter-item">
                <div className="counter-value">{timeLeft.years}</div>
                <div className="counter-label">Years</div>
              </div>
              <div className="counter-item">
                <div className="counter-value">{timeLeft.days}</div>
                <div className="counter-label">Days</div>
              </div>
              <div className="counter-item">
                <div className="counter-value">{timeLeft.hours}</div>
                <div className="counter-label">Hours</div>
              </div>
              <div className="counter-item">
                <div className="counter-value">{timeLeft.minutes}</div>
                <div className="counter-label">Mins</div>
              </div>
              <div className="counter-item">
                <div className="counter-value">{timeLeft.seconds}</div>
                <div className="counter-label">Secs</div>
              </div>
            </div>
            
            <div className="counter-footer-text">
              <p>For context, Samit was not even born yet. In fact, his parents probably hadn't even met yet.</p>
              <p style={{ color: 'var(--knicks-orange-text)', fontWeight: '600', marginTop: '0.5rem' }}>
                Total championship rings witnessed by Samit: 0
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Excuse Generator */}
        {activeTab === 'excuse' && (
          <div className="glass-card">
            <h2 className="card-title">
              <span>🤡</span> The Samit Knicks Excuse Generator
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Did the Knicks drop a 15-point lead in the 4th quarter? Did they miss the playoffs again? 
              Don't worry, Samit has a list of pre-approved excuses ready. Generate one below!
            </p>
            
            <div className={`excuse-box ${excuseAnimate ? 'active-animation' : ''}`}>
              <p className="excuse-text">&ldquo;{currentExcuse}&rdquo;</p>
              <span className="excuse-author">— Samit Mustafa, Certified Knicks Copium Dispenser</span>
            </div>
            
            <button className="btn-primary" onClick={generateNewExcuse}>
              Generate Next Excuse
            </button>
          </div>
        )}

        {/* Tab 4: Trade Machine */}
        {activeTab === 'trade' && (
          <div className="glass-card">
            <h2 className="card-title">
              <span>🏀</span> Samit's Delusional Trade Machine
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Samit is notorious in the group chat for proposing trades that make 100% sense to him, 
              but would get any real GM immediately fired. Select one of his trades below and analyze it.
            </p>
            
            <div className="trade-machine">
              <div className="form-group" style={{ maxWidth: '400px' }}>
                <label className="form-label" htmlFor="trade-select">Choose a Proposed Trade:</label>
                <select 
                  id="trade-select"
                  className="form-select"
                  value={selectedTrade.id}
                  onChange={(e) => {
                    const found = TRADE_OPTIONS.find(t => t.id === e.target.value);
                    if (found) {
                      setSelectedTrade(found);
                      setAnalysisResult(null);
                    }
                  }}
                >
                  {TRADE_OPTIONS.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="trade-row">
                {/* Knicks Column */}
                <div className="trade-column">
                  <div className="trade-team-header" style={{ color: 'var(--knicks-blue-text)' }}>
                    <span>NY Knicks Receive:</span>
                    <span>🗽</span>
                  </div>
                  <div className="trade-item-list">
                    <div className="trade-item" style={{ borderColor: 'rgba(0, 107, 182, 0.3)' }}>
                      <span className="trade-item-desc" style={{ color: '#FFF' }}>{selectedTrade.knicksGet}</span>
                      <span className="trade-item-val" style={{ color: 'var(--knicks-blue-text)' }}>Superstar</span>
                    </div>
                  </div>
                </div>
                
                <div className="trade-arrow">➡️<br/>⬅️</div>
                
                {/* Opponent Column */}
                <div className="trade-column">
                  <div className="trade-team-header" style={{ color: 'var(--knicks-orange-text)' }}>
                    <span>Opponent Receives:</span>
                    <span>🤝</span>
                  </div>
                  <div className="trade-item-list">
                    {selectedTrade.knicksGive.map((asset, index) => (
                      <div key={index} className="trade-item" style={{ borderColor: 'rgba(245, 132, 38, 0.2)' }}>
                        <span className="trade-item-desc">{asset.name}</span>
                        <span className="trade-item-val">{asset.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="trade-btn-container">
                <button 
                  className="btn-primary" 
                  onClick={analyzeTrade}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing Trade..." : "Run Trade Analysis"}
                </button>
              </div>

              {isAnalyzing && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div className="typing-indicator" style={{ margin: '0 auto', float: 'none', alignSelf: 'center' }}>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Consulting with actual NBA General Managers...
                  </p>
                </div>
              )}

              {analysisResult && !isAnalyzing && (
                <div className="trade-verdict-box">
                  <div className="verdict-header">
                    <h3 className="verdict-title">Trade Machine Verdict</h3>
                    <span className={`verdict-score ${analysisResult.passed ? 'passed' : ''}`}>
                      {analysisResult.passed ? "SUCCESS" : "REJECTED"}
                    </span>
                  </div>
                  
                  <div className="verdict-details">
                    <div className="detail-metric">
                      <div className="metric-label">Trade Feasibility</div>
                      <div className="metric-value" style={{ color: '#EF4444', fontWeight: '700' }}>
                        {analysisResult.feasibility}
                      </div>
                    </div>
                    
                    <div className="detail-metric">
                      <div className="metric-label">Samit's Confidence</div>
                      <div className="metric-value" style={{ color: 'var(--knicks-orange-text)' }}>
                        {analysisResult.samitConfidence}
                      </div>
                    </div>
                    
                    <div className="detail-metric" style={{ gridColumn: 'span 2' }}>
                      <div className="metric-label">Front Office Reaction</div>
                      <div className="metric-value" style={{ fontSize: '0.95rem', fontStyle: 'italic', fontWeight: 'normal', color: 'var(--text-primary)' }}>
                        &quot;{analysisResult.espnVerdict}&quot;
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Refund Form */}
        {activeTab === 'refund' && (
          <div className="glass-card">
            <h2 className="card-title">
              <span>🎟️</span> Samit's Knicks Ticket Refund Application
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Are you tired of paying thousands of dollars to watch the Knicks get knocked out in the second round? 
              Fill out this official form to request a emotional and financial refund.
            </p>
            
            <form className="refund-form" onSubmit={handleRefundSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="refund-name">Applicant Name:</label>
                <input 
                  type="text" 
                  id="refund-name"
                  className="form-input" 
                  value="Samit Mustafa" 
                  readOnly 
                  style={{ color: 'var(--text-muted)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="refund-reason">Reason for Disappointment:</label>
                <select 
                  id="refund-reason"
                  className="form-select"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                >
                  <option value="delusion">General Fan Delusion</option>
                  <option value="injury">Brunson's shin splints (again)</option>
                  <option value="ref">The referee was breathing too loudly</option>
                  <option value="ego">Ego damage in the group chat from Chris & Arvind</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Level of Copium Required:</label>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    className="form-slider"
                    value={copiumLevel}
                    onChange={(e) => setCopiumLevel(Number(e.target.value))}
                  />
                  <span className="slider-label">
                    {copiumLevel}% {copiumLevel > 80 ? "🚨 (Lethal)" : copiumLevel > 50 ? "⚠️ (High)" : "Mild"}
                  </span>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <input 
                  type="checkbox" 
                  id="willing-to-switch"
                  checked={willingToSwitch}
                  onChange={(e) => setWillingToSwitch(e.target.checked)}
                />
                <label htmlFor="willing-to-switch" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                  I am willing to switch teams to a team that actually wins championships (e.g. Celtics)
                </label>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                Submit Refund Claim
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Popups */}
      {showRefundPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-icon">🚫</div>
            <h3 className="popup-title">Application Denied</h3>
            <p className="popup-desc">
              Your claim for an emotional and financial refund has been rejected by the NBA Fan Relations Board. 
              As a Knicks fan, you are legally bound to suffer forever. 
              {willingToSwitch ? " Also, trying to jump on the Celtics bandwagon is a prosecutable offense in New York." : ""}
            </p>
            <button className="btn-secondary" onClick={() => setShowRefundPopup(false)}>
              Acknowledge & Continue Suffering
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>Created with absolute love and zero remorse by Gaurav, Chris, and Arvind.</p>
        <p style={{ marginTop: '0.25rem' }}>
          Disclaimer: No Samits were harmed in the making of this app. Knicks fans, however, remain devastated.
        </p>
      </footer>
    </div>
  );
}

export default App;
