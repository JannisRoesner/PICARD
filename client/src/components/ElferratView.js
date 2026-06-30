import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { SitzungContext } from '../context/SitzungContext';
import { SocketContext } from '../context/SocketContext';
import {
  getZettelIcon,
  getZettelTypeLabel,
  getPriorityIcon,
  getSenderLabel,
  formatTime
} from './zettelUtils';

const ZETTEL_SYNC_INTERVAL_MS = 30000;

const RECIPIENT_OPTIONS = [
  { value: 'anModeration', label: 'An Moderation' },
  { value: 'anTechnik', label: 'An Technik' },
  { value: 'anKulissen', label: 'An Kulissen' },
  { value: 'anKueche', label: 'An Küche' },
  { value: 'anAlle', label: 'An Alle' }
];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: #000;
`;

const ChatHeader = styled.div`
  flex: 0 0 auto;
  padding: 10px 16px;
  border-bottom: 1px solid #222;
  background: #111;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChatTitle = styled.h2`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  font-size: 1.1rem;
  margin: 0;
`;

const ChatSubtitle = styled.span`
  color: #888;
  font-size: 0.8rem;
`;

const MessageArea = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const EmptyState = styled.div`
  margin: auto;
  text-align: center;
  color: #777;
  font-size: 0.95rem;
`;

const MessageRow = styled.div`
  display: flex;
  justify-content: ${props => (props.own ? 'flex-end' : 'flex-start')};
`;

const Bubble = styled.div`
  max-width: min(78%, 620px);
  border-radius: 14px;
  padding: 10px 12px;
  border: 2px solid;
  opacity: ${props => (props.closed ? 0.55 : 1)};
  background: ${props => {
    if (props.own) return '#2563eb';
    if (props.priority === 'dringend') return '#dc3545';
    if (props.priority === 'wichtig') return '#ff6b35';
    return '#fbbf24';
  }};
  color: ${props => {
    if (props.own || props.priority === 'dringend' || props.priority === 'wichtig') return '#fff';
    return '#181818';
  }};
  border-color: ${props => {
    if (props.own) return '#1d4ed8';
    if (props.priority === 'dringend') return '#c82333';
    if (props.priority === 'wichtig') return '#e55a2b';
    return '#e0a800';
  }};
  animation: ${props => (props.isNew ? 'bubbleIn 0.4s ease, blink 1s ease-in-out 2' : 'bubbleIn 0.2s ease')};

  @keyframes bubbleIn {
    from { transform: translateY(6px); opacity: 0; }
    to { transform: translateY(0); }
  }

  @keyframes blink {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    50% { box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.55); }
  }
`;

const BubbleHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 4px;
`;

const BubbleText = styled.div`
  font-size: 1rem;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const BubbleFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-size: 0.72rem;
  opacity: 0.85;
`;

const ClosedTag = styled.span`
  font-style: italic;
`;

const DoneButton = styled.button`
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.25);
  color: inherit;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;

  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;

const Composer = styled.form`
  flex: 0 0 auto;
  border-top: 1px solid #222;
  background: #111;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ComposerOptions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid #555;
  border-radius: 8px;
  background: #2d2d2d;
  color: #fff;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const ComposerInputRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
`;

const Textarea = styled.textarea`
  flex: 1 1 auto;
  padding: 10px 12px;
  border: 1px solid #555;
  border-radius: 10px;
  background: #2d2d2d;
  color: #fff;
  font-size: 1rem;
  line-height: 1.4;
  resize: none;
  min-height: 44px;
  max-height: 160px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  }
`;

const SendButton = styled.button`
  flex: 0 0 auto;
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  border-radius: 10px;
  padding: 0 18px;
  height: 44px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    background: #444;
    color: #999;
    cursor: not-allowed;
  }
`;

const NoSitzungMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  font-size: 1.2rem;
  color: #ccc;
  text-align: center;
  padding: 20px;
`;

function ElferratView() {
  const { aktiveSitzung } = useContext(SitzungContext);
  const socket = useContext(SocketContext);

  const [zettel, setZettel] = useState([]);
  const [formData, setFormData] = useState({
    text: '',
    type: 'anModeration',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bottomRef = useRef(null);

  const loadZettel = useCallback(async () => {
    if (!aktiveSitzung) return;
    try {
      const response = await axios.get(`/api/sitzung/${aktiveSitzung}/zettel`);
      setZettel(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Fehler beim Laden der Zettel:', error);
    }
  }, [aktiveSitzung]);

  useEffect(() => {
    if (!aktiveSitzung) return;
    loadZettel();
  }, [aktiveSitzung, loadZettel]);

  useEffect(() => {
    if (!socket || !aktiveSitzung) return;

    const joinAndSync = () => {
      socket.emit('joinSitzung', aktiveSitzung);
      loadZettel();
    };

    if (socket.connected) {
      joinAndSync();
    }

    socket.on('connect', joinAndSync);

    return () => {
      socket.off('connect', joinAndSync);
      socket.emit('leaveSitzung', aktiveSitzung);
    };
  }, [socket, aktiveSitzung, loadZettel]);

  useEffect(() => {
    if (!socket || !aktiveSitzung) return;

    const handleZettelUpdate = () => loadZettel();
    socket.on('zettelHinzugefuegt', handleZettelUpdate);
    socket.on('zettelGeschlossen', handleZettelUpdate);

    return () => {
      socket.off('zettelHinzugefuegt', handleZettelUpdate);
      socket.off('zettelGeschlossen', handleZettelUpdate);
    };
  }, [socket, aktiveSitzung, loadZettel]);

  useEffect(() => {
    if (!aktiveSitzung) return;
    const syncInterval = setInterval(() => {
      loadZettel();
    }, ZETTEL_SYNC_INTERVAL_MS);
    return () => clearInterval(syncInterval);
  }, [aktiveSitzung, loadZettel]);

  const messages = useMemo(() => {
    return [...zettel]
      .filter((z) => {
        if (z.sender === 'elferrat') return true;
        return z.type === 'anModeration' || z.type === 'anAlle';
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [zettel]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!formData.text.trim() || !aktiveSitzung) return;

    setIsSubmitting(true);
    try {
      await axios.post(`/api/sitzung/${aktiveSitzung}/zettel`, {
        text: formData.text.trim(),
        type: formData.type,
        priority: formData.priority,
        sender: 'elferrat'
      });
      setFormData(prev => ({ ...prev, text: '', priority: 'normal' }));
    } catch (error) {
      console.error('Fehler beim Senden des Zettels:', error);
      alert('Fehler beim Senden der Nachricht');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleMarkDone = async (zettelId) => {
    if (!aktiveSitzung) return;
    try {
      await axios.delete(`/api/sitzung/${aktiveSitzung}/zettel/${zettelId}`);
    } catch (error) {
      console.error('Fehler beim Markieren als erledigt:', error);
    }
  };

  if (!aktiveSitzung) {
    return (
      <NoSitzungMessage>
        Keine aktive Sitzung ausgewählt. Bitte wählen Sie eine Sitzung aus.
      </NoSitzungMessage>
    );
  }

  return (
    <Container>
      <ChatHeader>
        <ChatTitle>🎩 Elferrat-Chat</ChatTitle>
        <ChatSubtitle>Live-Nachrichten der aktuellen Sitzung</ChatSubtitle>
      </ChatHeader>

      <MessageArea>
        {messages.length === 0 ? (
          <EmptyState>Noch keine Nachrichten. Schreibe die erste Nachricht unten.</EmptyState>
        ) : (
          messages.map((msg) => {
            const own = msg.sender === 'elferrat';
            const isNew = Date.now() - new Date(msg.timestamp).getTime() < 5000;
            return (
              <MessageRow key={msg.id} own={own}>
                <Bubble own={own} priority={msg.priority} closed={msg.geschlossen} isNew={isNew}>
                  <BubbleHeader>
                    <span>
                      {own
                        ? `Du → ${getZettelTypeLabel(msg.type)}`
                        : `${getSenderLabel(msg.sender)} ${getZettelIcon(msg.type)}`}
                    </span>
                    {getPriorityIcon(msg.priority) && <span>{getPriorityIcon(msg.priority)}</span>}
                  </BubbleHeader>
                  <BubbleText>{msg.text}</BubbleText>
                  <BubbleFooter>
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.geschlossen ? (
                      <ClosedTag>erledigt</ClosedTag>
                    ) : (
                      !own && (
                        <DoneButton type="button" onClick={() => handleMarkDone(msg.id)}>
                          ✓ erledigt
                        </DoneButton>
                      )
                    )}
                  </BubbleFooter>
                </Bubble>
              </MessageRow>
            );
          })
        )}
        <div ref={bottomRef} />
      </MessageArea>

      <Composer onSubmit={handleSend}>
        <ComposerOptions>
          <Select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            aria-label="Empfänger"
          >
            {RECIPIENT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            aria-label="Priorität"
          >
            <option value="normal">Normal</option>
            <option value="wichtig">Wichtig</option>
            <option value="dringend">Dringend</option>
          </Select>
        </ComposerOptions>
        <ComposerInputRow>
          <Textarea
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben... (Enter sendet, Shift+Enter für neue Zeile)"
            rows={1}
          />
          <SendButton type="submit" disabled={isSubmitting || !formData.text.trim()}>
            {isSubmitting ? '...' : 'Senden'}
          </SendButton>
        </ComposerInputRow>
      </Composer>
    </Container>
  );
}

export default ElferratView;
