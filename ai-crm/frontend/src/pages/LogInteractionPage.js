import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveTab,
  addChatMessage,
  sendChatMessage,
  createInteraction,
  fetchInteractions
} from '../store/interactionsSlice';
import './LogInteractionPage.css';

// =================== STRUCTURED FORM COMPONENT ===================
function InteractionForm() {
  const dispatch = useDispatch();
  const { loading } = useSelector(s => s.interactions);

  const [form, setForm] = useState({
    hcp_name: '',
    interaction_type: 'Meeting',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    attendees: '',
    topics_discussed: '',
    materials_shared: [],
    samples_distributed: [],
    sentiment: 'neutral',
    outcomes: '',
    follow_up_actions: ''
  });

  const [materialInput, setMaterialInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMaterial = () => {
    if (materialInput.trim()) {
      setForm({ ...form, materials_shared: [...form.materials_shared, materialInput.trim()] });
      setMaterialInput('');
    }
  };

  const addSample = () => {
    if (sampleInput.trim()) {
      setForm({ ...form, samples_distributed: [...form.samples_distributed, sampleInput.trim()] });
      setSampleInput('');
    }
  };

  const removeMaterial = (idx) => {
    setForm({ ...form, materials_shared: form.materials_shared.filter((_, i) => i !== idx) });
  };

  const removeSample = (idx) => {
    setForm({ ...form, samples_distributed: form.samples_distributed.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hcp_name || !form.date) return;

    await dispatch(createInteraction(form));
    dispatch(fetchInteractions());
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm({
      hcp_name: '',
      interaction_type: 'Meeting',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      attendees: '',
      topics_discussed: '',
      materials_shared: [],
      samples_distributed: [],
      sentiment: 'neutral',
      outcomes: '',
      follow_up_actions: ''
    });
  };

  return (
    <div className="form-container">
      <h2 className="section-title">Interaction Details</h2>

      {success && <div className="success-banner">✓ Interaction logged successfully!</div>}

      <form onSubmit={handleSubmit}>
        {/* Row 1: HCP Name + Type */}
        <div className="form-row">
          <div className="form-group">
            <label>HCP Name *</label>
            <input
              name="hcp_name"
              value={form.hcp_name}
              onChange={handleChange}
              placeholder="Search or select HCP..."
              required
            />
          </div>
          <div className="form-group">
            <label>Interaction Type</label>
            <select name="interaction_type" value={form.interaction_type} onChange={handleChange}>
              <option>Meeting</option>
              <option>Call</option>
              <option>Email</option>
              <option>Conference</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date + Time */}
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Time</label>
            <input type="time" name="time" value={form.time} onChange={handleChange} />
          </div>
        </div>

        {/* Attendees */}
        <div className="form-group full">
          <label>Attendees</label>
          <input
            name="attendees"
            value={form.attendees}
            onChange={handleChange}
            placeholder="Enter names or search..."
          />
        </div>

        {/* Topics Discussed */}
        <div className="form-group full">
          <label>Topics Discussed</label>
          <textarea
            name="topics_discussed"
            value={form.topics_discussed}
            onChange={handleChange}
            placeholder="Enter key discussion points..."
            rows={3}
          />
        </div>

        {/* Materials Shared */}
        <div className="form-group full">
          <label>Materials Shared / Samples Distributed</label>
          <div className="tag-section">
            <div className="tag-subsection">
              <p className="subsection-label">Materials Shared</p>
              <div className="tag-list">
                {form.materials_shared.map((m, i) => (
                  <span key={i} className="tag">
                    {m} <button type="button" onClick={() => removeMaterial(i)}>×</button>
                  </span>
                ))}
                {form.materials_shared.length === 0 && <p className="empty-text">No materials added</p>}
              </div>
              <div className="tag-input-row">
                <input
                  value={materialInput}
                  onChange={e => setMaterialInput(e.target.value)}
                  placeholder="Add material..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                />
                <button type="button" className="add-btn" onClick={addMaterial}>
                  🔍 Search/Add
                </button>
              </div>
            </div>

            <div className="tag-subsection">
              <p className="subsection-label">Samples Distributed</p>
              <div className="tag-list">
                {form.samples_distributed.map((s, i) => (
                  <span key={i} className="tag">
                    {s} <button type="button" onClick={() => removeSample(i)}>×</button>
                  </span>
                ))}
                {form.samples_distributed.length === 0 && <p className="empty-text">No samples added</p>}
              </div>
              <div className="tag-input-row">
                <input
                  value={sampleInput}
                  onChange={e => setSampleInput(e.target.value)}
                  placeholder="Add sample..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSample())}
                />
                <button type="button" className="add-btn" onClick={addSample}>
                  💊 Add Sample
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment */}
        <div className="form-group full">
          <label>Observed/Inferred HCP Sentiment</label>
          <div className="sentiment-group">
            {['positive', 'neutral', 'negative'].map(s => (
              <label key={s} className={`sentiment-btn ${form.sentiment === s ? 'active ' + s : ''}`}>
                <input
                  type="radio"
                  name="sentiment"
                  value={s}
                  checked={form.sentiment === s}
                  onChange={handleChange}
                />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        <div className="form-group full">
          <label>Outcomes</label>
          <textarea
            name="outcomes"
            value={form.outcomes}
            onChange={handleChange}
            placeholder="Key outcomes or agreements..."
            rows={2}
          />
        </div>

        {/* Follow-up Actions */}
        <div className="form-group full">
          <label>Follow-up Actions</label>
          <textarea
            name="follow_up_actions"
            value={form.follow_up_actions}
            onChange={handleChange}
            placeholder="Enter next steps or tasks..."
            rows={2}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Saving...' : '💾 Log Interaction'}
        </button>
      </form>
    </div>
  );
}


// =================== AI CHAT COMPONENT ===================
function AIChat() {
  const dispatch = useDispatch();
  const { chatMessages, chatLoading } = useSelector(s => s.interactions);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || chatLoading) return;

    const userMsg = input.trim();
    setInput('');

    dispatch(addChatMessage({ role: 'user', content: userMsg }));

    await dispatch(sendChatMessage({
      message: userMsg,
      conversationHistory: chatMessages
    }));

    dispatch(fetchInteractions());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span className="chat-icon">🤖</span>
        <div>
          <h3>AI Assistant</h3>
          <p>Log interaction details here</p>
        </div>
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="chat-welcome">
            <p>👋 Hi! I'm your AI assistant.</p>
            <p>You can tell me about your interaction with an HCP and I'll log it for you.</p>
            <p><em>Try: "Met Dr. Smith today at 3pm, discussed Product X efficacy, he seemed positive. I need to send him the brochure next week."</em></p>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="message-bubble">
              {msg.content}
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="chat-message assistant">
            <div className="message-bubble typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe interaction..."
          rows={2}
          disabled={chatLoading}
        />
        <button onClick={sendMessage} disabled={chatLoading || !input.trim()} className="send-btn">
          {chatLoading ? '...' : '🤖 Log'}
        </button>
      </div>
    </div>
  );
}


// =================== INTERACTIONS LIST ===================
function InteractionsList() {
  const { list, loading } = useSelector(s => s.interactions);

  if (loading) return <p className="loading-text">Loading...</p>;

  return (
    <div className="interactions-list">
      <h3>Recent Interactions ({list.length})</h3>
      {list.length === 0 && <p className="empty-text">No interactions logged yet.</p>}
      {list.map(item => (
        <div key={item.id} className="interaction-card">
          <div className="card-header">
            <strong>{item.hcp_name}</strong>
            <span className={`badge ${item.sentiment}`}>{item.sentiment}</span>
          </div>
          <div className="card-meta">
            <span>📅 {item.date}</span>
            <span>📋 {item.interaction_type}</span>
          </div>
          {item.topics_discussed && (
            <p className="card-topics">{item.topics_discussed.substring(0, 100)}...</p>
          )}
        </div>
      ))}
    </div>
  );
}


// =================== MAIN PAGE ===================
export default function LogInteractionPage() {
  const dispatch = useDispatch();
  const { activeTab } = useSelector(s => s.interactions);

  useEffect(() => {
    dispatch(fetchInteractions());
  }, [dispatch]);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo">💊 PharmaCRM</span>
          <span className="header-divider">|</span>
          <span>Log HCP Interaction</span>
        </div>
      </header>

      <div className="main-layout">
        {/* Left Panel: Form or Chat */}
        <div className="left-panel">
          {/* Tab switcher */}
          <div className="tab-bar">
            <button
              className={`tab ${activeTab === 'form' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('form'))}
            >
              📝 Structured Form
            </button>
            <button
              className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab('chat'))}
            >
              🤖 AI Chat
            </button>
          </div>

          {activeTab === 'form' ? <InteractionForm /> : <AIChat />}
        </div>

        {/* Right Panel: Interactions List */}
        <div className="right-panel">
          <InteractionsList />
        </div>
      </div>
    </div>
  );
}
