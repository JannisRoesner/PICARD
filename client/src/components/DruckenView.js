import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import QRCode from 'qrcode';
import { SitzungContext } from '../context/SitzungContext';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: #181818;
  border-radius: 12px;
  box-shadow: 0 2px 12px #0008;
`;

const Title = styled.h2`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  text-align: center;
  margin-bottom: 18px;
`;

const Subtitle = styled.p`
  color: #ccc;
  text-align: center;
  margin-bottom: 32px;
`;

const ButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const PrintButton = styled.button`
  background: ${props => props.theme?.colors?.primary || '#fbbf24'};
  color: #181818;
  border: none;
  border-radius: 8px;
  padding: 20px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #f59e0b;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }

`;

const ButtonIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;

const ButtonTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

const ButtonDescription = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
  text-align: center;
`;

const InfoBox = styled.div`
  background: #232323;
  border: 1px solid #444;
  border-radius: 8px;
  padding: 16px;
  margin-top: 24px;
`;

const InfoTitle = styled.h3`
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  margin-bottom: 8px;
`;

const InfoText = styled.p`
  color: #ccc;
  font-size: 0.9rem;
  line-height: 1.4;
`; 

function DruckenView() {
  const { aktiveSitzung } = useContext(SitzungContext);
  const [sitzung, setSitzung] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (aktiveSitzung) {
      loadSitzung();
    }
  }, [aktiveSitzung]);

  const loadSitzung = async () => {
    if (!aktiveSitzung) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/sitzung/${aktiveSitzung}`);
      if (!response.ok) throw new Error('Sitzung nicht gefunden');
      const data = await response.json();
      setSitzung(data);
    } catch (err) {
      setError('Fehler beim Laden der Sitzung');
      console.error('Fehler beim Laden der Sitzung:', err);
    } finally {
      setLoading(false);
    }
  };

  const printProgrammansicht = async () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    const printDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    try {
      const qrCodeSvg = await QRCode.toString(serverUrl + '/programmansicht', {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
      });
      const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Programm - ${sitzung.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 8px; 
              padding: 10px; 
              page-break-inside: avoid;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 10px;
            }
            .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
            .typ { color: #666; font-size: 14px; }
            .dauer { color: #666; font-size: 14px; }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #999;
              border-top: 1px solid #ddd;
              padding: 5px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            .qr svg {
              width: 48px;
              height: 48px;
              filter: none;
              opacity: 1;
              flex-shrink: 0;
              display: block;
              shape-rendering: crispEdges;
              image-rendering: pixelated;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
              .footer { padding: 3px 5px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear}</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div>
                <span class="nummer">${pp.nummer}</span>
                <span class="name">${pp.name}</span>
              </div>
              <div class="typ">${pp.typ}</div>
              <div class="dauer">Dauer: ${pp.dauer ? Math.round(pp.dauer / 60) + ' Minuten' : 'Keine Angabe'}</div>
            </div>
          `).join('')}
          <div class="footer">
            <div class="qr">${qrCodeSvg}</div>
            <div style="text-align: left;">
              <div>Änderungen vorbehalten, Stand ${printDate} Uhr</div>
              <div style="margin-top: 2px;">Live-Informationen: ${serverUrl}/programmansicht</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 100);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    }
  };

  const printKulissenView = async () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    const printDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    try {
      const qrCodeSvg = await QRCode.toString(serverUrl + '/programmansicht', {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
      });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kulissen - ${sitzung.name}</title>
          <style>
            @page { size: landscape; }
            body { font-family: Arial, sans-serif; margin: 15px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 8px; 
              padding: 8px; 
              page-break-inside: avoid;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .programm-left {
              flex: 1;
              margin-right: 15px;
            }
            .programm-center {
              flex: 1;
              margin: 0 15px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .buehne-box {
              background: #f0f8ff;
              border: 2px solid #4a90e2;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              min-height: 60px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .programm-right {
              width: 200px;
              background: #f5f5f5;
              padding: 8px;
              border-radius: 4px;
              font-size: 12px;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 25px; 
              height: 25px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 8px;
              font-size: 12px;
            }
            .name { font-weight: bold; font-size: 16px; margin-bottom: 4px; }
            .typ { color: #666; font-size: 12px; margin-bottom: 4px; }
            .dauer { color: #666; font-size: 12px; }
            .kulissen-title { font-weight: bold; margin-bottom: 6px; font-size: 11px; }
            .kulissen-item { margin-bottom: 3px; }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #999;
              border-top: 1px solid #ddd;
              padding: 5px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            .qr svg {
              width: 48px;
              height: 48px;
              filter: none;
              opacity: 1;
              flex-shrink: 0;
              display: block;
              shape-rendering: crispEdges;
              image-rendering: pixelated;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
              .footer { padding: 3px 5px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear}</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div class="programm-left">
                <div>
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div class="dauer">Dauer: ${pp.dauer ? Math.round(pp.dauer / 60) + ' Minuten' : 'Keine Angabe'}</div>
              </div>
              <div class="programm-center">
                <div class="buehne-box">
                  🎪 ${pp.buehne || 'Bühne: frei'}
                </div>
              </div>
              <div class="programm-right">
                <div class="kulissen-item"><span style="color: #4ade80;">→</span> <strong>Einzug:</strong> ${pp.einzugCD ? 'Von CD' : 'Von Kapelle'}</div>
                <div class="kulissen-item"><span style="color: #f87171;">←</span> <strong>Auszug:</strong> ${pp.auszugCD ? 'Von CD' : 'Von Kapelle'}</div>
              </div>
            </div>
          `).join('')}
          <div class="footer">
            <div class="qr">${qrCodeSvg}</div>
            <div style="text-align: left;">
              <div>Änderungen vorbehalten, Stand ${printDate} Uhr</div>
              <div style="margin-top: 2px;">Live-Informationen: ${serverUrl}/programmansicht</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 100);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    }
  };

  const printModerationView = async () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    const printDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    try {
      const qrCodeSvg = await QRCode.toString(serverUrl + '/programmansicht', {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 2,
      });
      const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moderation - ${sitzung.name}</title>
          <style>
            @page { size: landscape; }
            body { font-family: Arial, sans-serif; margin: 15px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 8px; 
              padding: 8px; 
              page-break-inside: avoid;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .programm-left {
              flex: 1;
              margin-right: 15px;
            }
            .programm-right {
              width: 250px;
              background: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              font-size: 12px;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 25px; 
              height: 25px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 8px;
              font-size: 12px;
            }
            .name { font-weight: bold; font-size: 16px; margin-bottom: 6px; }
            .typ { color: #666; font-size: 12px; margin-bottom: 6px; }
            .dauer { color: #666; font-size: 12px; margin-bottom: 8px; }
            .moderation-info { 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 5px; 
              margin-top: 8px;
            }
            .moderation-title { font-weight: bold; margin-bottom: 6px; font-size: 13px; }
            .moderation-item { margin-bottom: 4px; font-size: 12px; }
            .moderation-text {
              background: #fff3cd;
              padding: 6px;
              border-radius: 3px;
              margin-top: 4px;
              font-size: 11px;
              border-left: 3px solid #ffc107;
            }
            .right-title { font-weight: bold; margin-bottom: 8px; font-size: 13px; color: #333; }
            .right-item { margin-bottom: 6px; font-size: 11px; }
            .right-namensliste { 
              background: #e8f4fd; 
              padding: 4px; 
              border-radius: 3px; 
              margin-top: 2px;
              font-size: 10px;
            }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding: 5px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            .qr svg {
              width: 48px;
              height: 48px;
              filter: none;
              opacity: 1;
              flex-shrink: 0;
              display: block;
              shape-rendering: crispEdges;
              image-rendering: pixelated;
            }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
              .footer { padding: 3px 5px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear}</div>
          </div>
          ${sitzung.programmpunkte.map(pp => `
            <div class="programm-item">
              <div class="programm-left">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                  <span style="margin-left: auto; font-size: 12px; color: #666;">
                    ♪ Einzug: ${pp.einzugCD ? 'CD' : 'Kapelle'} | Auszug: ${pp.auszugCD ? 'CD' : 'Kapelle'}
                  </span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="dauer">Dauer: ${pp.dauer ? Math.round(pp.dauer / 60) + ' Minuten' : 'Keine Angabe'}</span>
                </div>
                <div class="moderation-info">
                  <div class="moderation-title">🎤 Moderation-Informationen</div>
                  <div class="moderation-item">
                    🎤 Anmoderation:
                    <div class="moderation-text">${pp.anmoderation || 'Noch nicht erstellt'}</div>
                  </div>
                  <div class="moderation-item">
                    🎤 Abmoderation:
                    <div class="moderation-text">${pp.abmoderation || 'Noch nicht erstellt'}</div>
                  </div>
                  <div class="moderation-item">
                    🎤 Notizen:
                    <div class="moderation-text">${pp.notizen || 'Keine Notizen'}</div>
                  </div>
                </div>
              </div>
              <div class="programm-right">
                <div class="right-title">👥 Personen & Namenslisten</div>
                ${pp.trainer ? `<div class="right-item">👨‍🏫 Trainer: ${pp.trainer}</div>` : ''}
                ${pp.betreuer ? `<div class="right-item">👨‍💼 Betreuer: ${pp.betreuer}</div>` : ''}
                ${pp.namensliste && pp.namensliste.length > 0 ? `
                  <div class="right-item">
                    👥 Namensliste:
                    <div class="right-namensliste">${pp.namensliste.join(', ')}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
          <div class="footer">
            <div class="qr">${qrCodeSvg}</div>
            <div style="text-align: left;">
              <div>Änderungen vorbehalten, Stand ${printDate} Uhr</div>
              <div style="margin-top: 2px;">Live-Informationen: ${serverUrl}/programmansicht</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 100);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    }
  };

  const printTechnikView = async () => {
    const currentYear = new Date().getFullYear();
    const serverUrl = window.location.origin;
    const printDate = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    try {
        const qrCodeSvg = await QRCode.toString(serverUrl + '/programmansicht', {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 2,
        });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Technik - ${sitzung.name}</title>
          <style>
            @page { size: landscape; }
            body { font-family: Arial, sans-serif; margin: 15px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; margin-bottom: 8px; }
            .programm-item { 
              border: 1px solid #ccc; 
              margin-bottom: 8px; 
              padding: 8px; 
              page-break-inside: avoid;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .programm-left {
              flex: 1;
              margin-right: 15px;
            }
            .programm-right {
              width: 280px;
              background: #f5f5f5;
              padding: 10px;
              border-radius: 5px;
              font-size: 12px;
            }
            .nummer { 
              background: #fbbf24; 
              color: #000; 
              width: 25px; 
              height: 25px; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold;
              margin-right: 8px;
              font-size: 12px;
            }
              .right-title { font-weight: bold; margin-bottom: 8px; font-size: 13px; color: #333; }
              .sticky-note {
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                border: 1px solid rgba(0,0,0,0.1);
                word-break: break-word;
                font-size: 11px;
                white-space: pre-wrap;
              }
              .sticky-note-title {
                font-weight: bold;
                margin-bottom: 6px;
                font-size: 12px;
              }
              .sticky-note-empty {
                padding: 8px;
                background: #eee;
                border-radius: 4px;
                color: #666;
                text-align: center;
                font-size: 11px;
              }
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 8px;
              color: #666;
              border-top: 1px solid #ccc;
              padding: 5px 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
              .qr svg {
                width: 48px;
                height: 48px;
                filter: none;
                opacity: 1;
                flex-shrink: 0;
                display: block;
                shape-rendering: crispEdges;
                image-rendering: pixelated;
              }
            @media print {
              body { margin: 0; }
              .programm-item { border: 1px solid #000; }
              .footer { padding: 3px 5px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sitzung.name} ${currentYear}</div>
          </div>
          ${sitzung.programmpunkte.map(pp => {
            const notes = Array.isArray(pp.pinboardNotes) ? pp.pinboardNotes : [];
            const notesHtml = notes.length > 0
              ? notes.map((note, idx) => {
                  const noteTitle = note.title || (note.type === 'audio' && note.audioName) || `Notiz ${idx + 1}`;
                  
                  if (note.type === 'audio') {
                    return `<div class="sticky-note" style="background: ${note.color || '#e0f7fa'}">
                      <div class="sticky-note-title">🎵 ${noteTitle}</div>
                      <div class="sticky-note-content" style="color: #666;">Audio-Datei: ${note.audioName || 'Ohne Namen'}</div>
                    </div>`;
                  }
                  
                  const content = (note.text || 'Leer').replace(/\n/g, '<br>');
                  const bg = note.color || '#fff3cd';
                  return `<div class="sticky-note" style="background: ${bg}"><div class="sticky-note-title">${noteTitle}</div><div class="sticky-note-content">${content}</div></div>`;
                }).join('')
              : '<div class="sticky-note-empty">Keine Notizen vorhanden</div>';
            return `
            <div class="programm-item">
              <div class="programm-left">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="nummer">${pp.nummer}</span>
                  <span class="name">${pp.name}</span>
                  <span style="margin-left: auto; font-size: 12px; color: #666;">
                    ♪ Einzug: ${pp.einzugCD ? 'CD' : 'Kapelle'} | Auszug: ${pp.auszugCD ? 'CD' : 'Kapelle'}
                  </span>
                </div>
                <div class="typ">${pp.typ}</div>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <span class="dauer">Dauer: ${pp.dauer ? Math.round(pp.dauer / 60) + ' Minuten' : 'Keine Angabe'}</span>
                </div>
              </div>
              <div class="programm-right">
                <div class="right-title">🗒️ Notizen</div>
                ${notesHtml}
              </div>
            </div>
          `}).join('')}
          <div class="footer">
              <div class="qr">${qrCodeSvg}</div>
            <div style="text-align: left;">
              <div>Änderungen vorbehalten, Stand ${printDate} Uhr</div>
              <div style="margin-top: 2px;">Live-Informationen: ${serverUrl}/programmansicht</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 100);
    } catch (error) {
      console.error('Fehler beim Generieren des QR-Codes:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#ccc' }}>Lade Sitzung...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#dc3545' }}>{error}</div>
      </Container>
    );
  }

  if (!sitzung) {
    return (
      <Container>
        <Title>Drucken</Title>
        <div style={{ textAlign: 'center', color: '#ccc' }}>Keine Sitzung ausgewählt</div>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Drucken</Title>
      <Subtitle>Wählen Sie eine Druckoption für die Sitzung "{sitzung.name}"</Subtitle>
      
      <ButtonGrid>
        <PrintButton onClick={printProgrammansicht}>
          <ButtonIcon>📋</ButtonIcon>
          <ButtonTitle>Programmansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm in der Übersichtsansicht ohne zusätzliche Details
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printKulissenView}>
          <ButtonIcon>🎭</ButtonIcon>
          <ButtonTitle>Kulissen-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit Einzug/Auszug und Bühneninformationen
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printModerationView}>
          <ButtonIcon>🎤</ButtonIcon>
          <ButtonTitle>Moderation-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit allen Moderation-Informationen und Namenslisten
          </ButtonDescription>
        </PrintButton>

        <PrintButton onClick={printTechnikView}>
          <ButtonIcon>🔧</ButtonIcon>
          <ButtonTitle>Technik-Ansicht</ButtonTitle>
          <ButtonDescription>
            Druckt das Programm mit Technik-Infos und den Notizen der Pinwand
          </ButtonDescription>
        </PrintButton>
      </ButtonGrid>

      <InfoBox>
        <InfoTitle>ℹ️ Druckhinweise</InfoTitle>
        <InfoText>
          • Jede Ansicht wird in einem neuen Fenster geöffnet und automatisch zum Drucken vorbereitet<br/>
          • Die Druckansicht ist für A4-Papier optimiert<br/>
          • Programmpunkte werden automatisch auf neue Seiten umgebrochen<br/>
          • Verwenden Sie "Als PDF speichern" für digitale Kopien
        </InfoText>
      </InfoBox>
    </Container>
  );
}

export default DruckenView; 