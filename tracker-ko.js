(function () {
  const API_PREFIX = (typeof window !== 'undefined' && window.WISHFAST_API_PREFIX) || '/api/ko';
  const STORAGE_KEY = 'wishfast_ko_events';
  const CONTACTS_KEY = 'wishfast_ko_contacts';
  const MARKETING_SOURCE_KEY = 'wishfast_ko_marketing_source';
  const VISITOR_KEY = 'wishfast_ko_visitor_id';
  const SESSION_KEY = 'wishfast_ko_session_id';

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function captureMarketingSource() {
    try {
      const fromUrl = new URLSearchParams(location.search).get('source');
      if (fromUrl) {
        const normalized = fromUrl.toLowerCase().trim();
        sessionStorage.setItem(MARKETING_SOURCE_KEY, normalized);
        return normalized;
      }
    } catch (_) {}
    return sessionStorage.getItem(MARKETING_SOURCE_KEY) || null;
  }

  function buildPayload(eventType, payload) {
    const base = { ...(payload || {}) };
    if (
      marketingSource &&
      (eventType === 'page_view' || eventType === 'submit_contact') &&
      base.source == null
    ) {
      base.source = marketingSource;
    }
    return Object.keys(base).length ? base : null;
  }

  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uuid();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  const marketingSource = captureMarketingSource();
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const fired = new Set();

  function readEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function persistEvent(record) {
    const list = readEvents();
    list.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    console.log('[WishFast KR Track]', record.event_type, record);
    console.log('[WishFast KR Events Total]', list.length, list);
    return list;
  }

  async function track(eventType, payload) {
    const record = {
      event_type: eventType,
      session_id: sessionId,
      visitor_id: visitorId,
      source: marketingSource || null,
      payload: buildPayload(eventType, payload),
      created_at: new Date().toISOString(),
    };

    persistEvent(record);

    try {
      const res = await fetch(`${API_PREFIX}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        keepalive: true,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('[WishFast KR Track API]', eventType, res.status, err.error || res.statusText);
      }
    } catch (e) {
      console.warn('[WishFast KR Track API]', eventType, 'network error', e);
    }
  }

  function trackOnce(eventType, payload) {
    const key = eventType + (payload ? JSON.stringify(payload) : '');
    if (fired.has(key)) return;
    fired.add(key);
    return track(eventType, payload);
  }

  async function submitContact(data) {
    const record = {
      ...data,
      session_id: sessionId,
      visitor_id: visitorId,
      source: marketingSource || null,
      created_at: new Date().toISOString(),
    };

    const contacts = JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
    contacts.push(record);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
    console.log('[WishFast KR Contact]', record);

    try {
      await fetch(`${API_PREFIX}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        keepalive: true,
      });
    } catch {
      /* localStorage primary */
    }

    await track('submit_contact', {
      has_email: !!data.email,
      has_phone: !!data.phone,
      wish_item: data.wish_item,
      goal_amount: data.goal_amount || null,
    });

    await track('preregistration_complete', {
      has_email: !!data.email,
      has_phone: !!data.phone,
      wish_item: data.wish_item,
      goal_amount: data.goal_amount || null,
    });
  }

  window.WishFastTracker = {
    sessionId,
    visitorId,
    marketingSource,
    market: 'kr',
    track,
    trackOnce,
    submitContact,
    getEvents: readEvents,
  };

  trackOnce('page_view', {
    referrer: document.referrer || null,
    path: location.pathname,
    brand: 'WishRace',
    market: 'kr',
    locale: 'ko',
    source: marketingSource || null,
  });
})();
