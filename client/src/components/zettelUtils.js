export function getZettelIcon(type) {
  switch (type) {
    case 'anModeration': return '📝';
    case 'anTechnik': return '🎛️';
    case 'anKulissen': return '🎭';
    case 'anKueche': return '🍽️';
    case 'anAlle': return '📢';
    default: return '📄';
  }
}

export function getZettelTypeLabel(type) {
  switch (type) {
    case 'anModeration': return 'An Moderation';
    case 'anTechnik': return 'An Technik';
    case 'anKulissen': return 'An Kulissen';
    case 'anKueche': return 'An Küche';
    case 'anAlle':
    default:
      return 'An Alle';
  }
}

export function getPriorityIcon(priority) {
  switch (priority) {
    case 'dringend': return '🚨';
    case 'wichtig': return '⚠️';
    default: return '';
  }
}

export function getSenderLabel(sender) {
  switch (sender) {
    case 'moderation': return 'Moderation';
    case 'technik': return 'Technik';
    case 'kulissen': return 'Kulissen';
    case 'elferrat': return 'Elferrat';
    case 'programmansicht': return 'Programmansicht';
    default: return sender || 'Unbekannt';
  }
}

export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
