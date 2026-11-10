import { useEffect, useState, useRef } from 'react';
import { useToast } from '../context/ToastContext.jsx';
import {
  fetchMeetingInfo,
  fetchSessionMessages,
  sendSessionMessage,
  fetchSessionResources,
  shareSessionResource,
  completeSessionApi,
} from '../services/api.js';

const createDefaultWorkspace = () => ({
  agenda: [
    'Align on the session goal',
    'Review progress and current blockers',
    'Agree on next steps',
  ],
  questions: [
    'What should I prioritize next?',
    'What risks or trade-offs should I consider?',
    'What can I prepare before our next session?',
  ],
  notes: '',
  resources: [],
  actionItems: [],
});

function readWorkspace(sessionId) {
  const defaults = createDefaultWorkspace();

  try {
    const stored = window.localStorage.getItem(`mentor-connect-workspace-${sessionId}`);
    if (!stored) return defaults;

    const workspace = JSON.parse(stored);
    return {
      ...defaults,
      ...workspace,
      agenda: Array.isArray(workspace.agenda) ? workspace.agenda : defaults.agenda,
      questions: Array.isArray(workspace.questions) ? workspace.questions : defaults.questions,
      resources: Array.isArray(workspace.resources) ? workspace.resources : defaults.resources,
      actionItems: Array.isArray(workspace.actionItems)
        ? workspace.actionItems
        : defaults.actionItems,
      notes: typeof workspace.notes === 'string' ? workspace.notes : defaults.notes,
    };
  } catch (error) {
    console.warn('Could not load saved session workspace:', error);
    return defaults;
  }
}

function ListEditor({ title, icon, items, placeholder, onAdd, onRemove }) {
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const item = value.trim();
    if (!item) return;
    onAdd(item);
    setValue('');
  };

  return (
    <section className="workspace-panel" aria-label={title}>
      <div className="workspace-panel-heading">
        <span aria-hidden="true">{icon}</span>
        <h2>{title}</h2>
        <span className="workspace-item-count">{items.length}</span>
      </div>
      {items.length > 0 ? (
        <ul className="workspace-list">
          {items.map((item, index) => (
            <li className="workspace-list-item" key={`${item}-${index}`}>
              <span>{item}</span>
              <button
                type="button"
                className="workspace-remove-button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${title.toLowerCase()} item: ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="workspace-empty-copy">Nothing here yet. Add your first item below.</p>
      )}
      <form className="workspace-inline-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`workspace-${title.replaceAll(' ', '-')}`}>
          Add to {title.toLowerCase()}
        </label>
        <input
          id={`workspace-${title.replaceAll(' ', '-')}`}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
        />
        <button type="submit" disabled={!value.trim()}>Add</button>
      </form>
    </section>
  );
}

export default function SessionWorkspace({ session, onBack }) {
  const toast = useToast();
  const [workspace, setWorkspace] = useState(() => readWorkspace(session.id));
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [actionItemText, setActionItemText] = useState('');

  // Live Backend Integration State
  const [meeting, setMeeting] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newChatText, setNewChatText] = useState('');
  const [sessionStatus, setSessionStatus] = useState(session.status || 'Confirmed');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  // Fetch meeting details and messages if session has an active ID
  useEffect(() => {
    let isMounted = true;

    async function loadLiveData() {
      try {
        const meetingRes = await fetchMeetingInfo(session.id).catch(() => null);
        if (isMounted && meetingRes?.data?.meeting) {
          setMeeting(meetingRes.data.meeting);
          if (meetingRes.data.meeting.sessionStatus) {
            setSessionStatus(meetingRes.data.meeting.sessionStatus);
          }
        }
      } catch {
        // Fallback gracefully for mock or offline sessions
      }

      try {
        const messagesRes = await fetchSessionMessages(session.id).catch(() => null);
        if (isMounted && messagesRes?.data?.messages) {
          setMessages(messagesRes.data.messages);
        }
      } catch {
        // Fallback gracefully
      }
    }

    if (session.id) {
      loadLiveData();
    }

    return () => {
      isMounted = false;
    };
  }, [session.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        `mentor-connect-workspace-${session.id}`,
        JSON.stringify(workspace)
      );
    } catch (error) {
      console.error('Could not save session workspace:', error);
      toast.error('Your changes could not be saved in this browser.', 'Workspace Save Failed');
    }
  }, [session.id, toast, workspace]);

  const updateList = (key, update) => {
    setWorkspace((current) => ({ ...current, [key]: update(current[key]) }));
  };

  const handleAddResource = async (event) => {
    event.preventDefault();
    const title = resourceTitle.trim();
    let url;

    try {
      url = new URL(resourceUrl.trim());
    } catch {
      toast.error('Enter a valid http or https link.', 'Invalid Resource Link');
      return;
    }

    if (!title || !['http:', 'https:'].includes(url.protocol)) {
      toast.error('Enter a title and a valid http or https link.', 'Invalid Resource');
      return;
    }

    setWorkspace((current) => ({
      ...current,
      resources: [...current.resources, { id: `${Date.now()}`, title, url: url.href }],
    }));

    // Attempt live backend synchronization
    try {
      await shareSessionResource(session.id, { title, url: url.href }).catch(() => null);
    } catch {
      // Local storage already updated
    }

    setResourceTitle('');
    setResourceUrl('');
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = newChatText.trim();
    if (!text) return;

    setIsSendingMessage(true);
    const localMsg = {
      id: `local-${Date.now()}`,
      content: text,
      senderName: 'You',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, localMsg]);
    setNewChatText('');

    try {
      const res = await sendSessionMessage(session.id, text).catch(() => null);
      if (res?.data?.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === localMsg.id ? res.data.message : m))
        );
      }
    } catch {
      // Message kept locally in conversation
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCompleteSession = async () => {
    try {
      await completeSessionApi(session.id);
      setSessionStatus('COMPLETED');
      toast.success('Mentorship session marked as completed!', 'Session Completed');
    } catch (err) {
      toast.info('Session marked as completed in this workspace.', 'Session Completed');
      setSessionStatus('COMPLETED');
    }
  };

  const handleAddActionItem = (event) => {
    event.preventDefault();
    const title = actionItemText.trim();
    if (!title) return;
    setWorkspace((current) => ({
      ...current,
      actionItems: [...current.actionItems, { id: `${Date.now()}`, title, completed: false }],
    }));
    setActionItemText('');
  };

  return (
    <section className="session-workspace" aria-labelledby="workspace-title">
      <button type="button" className="workspace-back-button" onClick={onBack}>
        ← Back to dashboard
      </button>

      <header className="workspace-hero">
        <div>
          <span className="workspace-eyebrow">MENTORSHIP SESSION WORKSPACE</span>
          <h1 id="workspace-title">{session.topic}</h1>
          <p>
            <strong>{session.mentorName}</strong>
            <span aria-hidden="true"> · </span>
            {session.date} at {session.time}
          </p>
        </div>
        <div className="workspace-hero-controls">
          {meeting?.canJoin !== false && (
            <a
              href={meeting?.meetingUrl || `https://meet.jit.si/mentor-connect-session-${session.id}`}
              target="_blank"
              rel="noreferrer"
              className="workspace-video-call-button"
              title="Launch embedded video call via Jitsi Meet"
            >
              🎥 Join Video Call
            </a>
          )}
          {sessionStatus !== 'COMPLETED' && (
            <button
              type="button"
              className="workspace-complete-session-button"
              onClick={handleCompleteSession}
            >
              ✓ Mark Complete
            </button>
          )}
          <span className="workspace-status">{sessionStatus}</span>
        </div>
      </header>

      <div className="workspace-grid">
        <ListEditor
          title="Meeting agenda"
          icon="🗓️"
          items={workspace.agenda}
          placeholder="Add an agenda topic"
          onAdd={(item) => updateList('agenda', (items) => [...items, item])}
          onRemove={(index) => updateList('agenda', (items) => items.filter((_, i) => i !== index))}
        />
        <ListEditor
          title="Questions to ask"
          icon="❔"
          items={workspace.questions}
          placeholder="Add a question for your mentor"
          onAdd={(item) => updateList('questions', (items) => [...items, item])}
          onRemove={(index) =>
            updateList('questions', (items) => items.filter((_, i) => i !== index))
          }
        />

        <section
          className="workspace-panel workspace-notes-panel"
          aria-labelledby="workspace-notes-heading"
        >
          <div className="workspace-panel-heading">
            <span aria-hidden="true">📝</span>
            <h2 id="workspace-notes-heading">Notes</h2>
          </div>
          <label className="sr-only" htmlFor="workspace-notes">Session notes</label>
          <textarea
            id="workspace-notes"
            className="workspace-notes"
            value={workspace.notes}
            onChange={(event) =>
              setWorkspace((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Capture key takeaways, ideas, and feedback from your session..."
            rows={8}
          />
          <p className="workspace-save-hint">Notes save automatically in this browser.</p>
        </section>

        <section className="workspace-panel" aria-label="Shared resources">
          <div className="workspace-panel-heading">
            <span aria-hidden="true">🔗</span>
            <h2>Shared resources</h2>
            <span className="workspace-item-count">{workspace.resources.length}</span>
          </div>
          {workspace.resources.length > 0 ? (
            <ul className="workspace-resource-list">
              {workspace.resources.map((resource) => (
                <li className="workspace-resource-item" key={resource.id}>
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    {resource.title}
                  </a>
                  <button
                    type="button"
                    className="workspace-remove-button"
                    onClick={() =>
                      setWorkspace((current) => ({
                        ...current,
                        resources: current.resources.filter((item) => item.id !== resource.id),
                      }))
                    }
                    aria-label={`Remove resource: ${resource.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-empty-copy">Keep useful links from you and your mentor here.</p>
          )}
          <form className="workspace-resource-form" onSubmit={handleAddResource}>
            <label className="sr-only" htmlFor="workspace-resource-title">Resource title</label>
            <input
              id="workspace-resource-title"
              value={resourceTitle}
              onChange={(event) => setResourceTitle(event.target.value)}
              placeholder="Resource title"
              required
            />
            <label className="sr-only" htmlFor="workspace-resource-url">Resource URL</label>
            <input
              id="workspace-resource-url"
              type="url"
              value={resourceUrl}
              onChange={(event) => setResourceUrl(event.target.value)}
              placeholder="https://example.com"
              required
            />
            <button type="submit">Add resource</button>
          </form>
        </section>

        <section className="workspace-panel workspace-actions-panel" aria-label="Action items">
          <div className="workspace-panel-heading">
            <span aria-hidden="true">✅</span>
            <h2>Action items</h2>
            <span className="workspace-item-count">
              {workspace.actionItems.filter((item) => item.completed).length}/
              {workspace.actionItems.length}
            </span>
          </div>
          {workspace.actionItems.length > 0 ? (
            <ul className="workspace-action-list">
              {workspace.actionItems.map((item) => (
                <li className="workspace-action-item" key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() =>
                        updateList('actionItems', (items) =>
                          items.map((action) =>
                            action.id === item.id
                              ? { ...action, completed: !action.completed }
                              : action
                          )
                        )
                      }
                    />
                    <span className={item.completed ? 'is-completed' : ''}>{item.title}</span>
                  </label>
                  <button
                    type="button"
                    className="workspace-remove-button"
                    onClick={() =>
                      updateList('actionItems', (items) => items.filter((action) => action.id !== item.id))
                    }
                    aria-label={`Remove action item: ${item.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-empty-copy">Turn your conversation into clear next steps.</p>
          )}
          <form className="workspace-inline-form" onSubmit={handleAddActionItem}>
            <label className="sr-only" htmlFor="workspace-action-item">New action item</label>
            <input
              id="workspace-action-item"
              value={actionItemText}
              onChange={(event) => setActionItemText(event.target.value)}
              placeholder="Add a follow-up task"
            />
            <button type="submit" disabled={!actionItemText.trim()}>Add</button>
          </form>
        </section>

        <section className="workspace-panel workspace-chat-panel" aria-label="Session chat">
          <div className="workspace-panel-heading">
            <span aria-hidden="true">💬</span>
            <h2>Session chat</h2>
            <span className="workspace-item-count">{messages.length}</span>
          </div>
          <div className="workspace-chat-container">
            {messages.length > 0 ? (
              <ul className="workspace-chat-messages">
                {messages.map((msg) => (
                  <li key={msg.id} className="workspace-chat-message-item">
                    <strong className="workspace-chat-sender">{msg.senderName || 'Participant'}: </strong>
                    <span className="workspace-chat-text">{msg.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="workspace-empty-copy">No messages yet. Send a note to your mentor!</p>
            )}
          </div>
          <form className="workspace-inline-form" onSubmit={handleSendMessage}>
            <label className="sr-only" htmlFor="workspace-chat-input">Send message</label>
            <input
              id="workspace-chat-input"
              value={newChatText}
              onChange={(event) => setNewChatText(event.target.value)}
              placeholder="Type a message to your mentor..."
            />
            <button type="submit" disabled={!newChatText.trim() || isSendingMessage}>
              {isSendingMessage ? 'Sending...' : 'Send'}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
