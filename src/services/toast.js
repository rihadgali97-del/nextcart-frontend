const EVENT_NAME = 'gebeyaplus:toast';
let nextId = 0;

const emit = (detail) => window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));

export const toast = {
  success: (message) => emit({ id: ++nextId, type: 'success', message }),
  error: (message) => emit({ id: ++nextId, type: 'error', message }),
  info: (message) => emit({ id: ++nextId, type: 'info', message }),
  confirm: (message, confirmLabel = 'Confirm') => new Promise((resolve) => {
    emit({ id: ++nextId, type: 'confirm', message, confirmLabel, resolve });
  }),
};

export const TOAST_EVENT_NAME = EVENT_NAME;
