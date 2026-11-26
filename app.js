const ANALYTICS_MESSAGE = '[Analytics] User interacted with Static Landing Page';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SERVICE_LABELS = {
  'solo-walk': 'Solo Walk (30 Min)',
  'extended-solo': 'Extended Solo (60 Min)',
  'puppy-checkin': 'Puppy Check-In (30 Min)'
};

const activeControllers = new WeakMap();

/**
 * Trims surrounding whitespace and strips script blocks, HTML tags,
 * angle brackets, and control characters before saving user input.
 */
export function sanitizeInput(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
}

function validateFields(values) {
  const errors = {};

  if (!values.ownerName) {
    errors['owner-name'] = 'Please enter the owner name.';
  }

  if (!values.ownerEmail) {
    errors['owner-email'] = 'Please enter an email address.';
  } else if (!EMAIL_PATTERN.test(values.ownerEmail)) {
    errors['owner-email'] = 'Please enter a valid email address.';
  }

  if (!values.dogName) {
    errors['dog-name'] = 'Please enter your dog’s name.';
  }

  if (!values.serviceTier) {
    errors['service-tier'] = 'Please select a walk service plan.';
  }

  if (!values.walkDate) {
    errors['walk-date'] = 'Please choose a preferred walk date.';
  }

  return errors;
}

function applyFieldErrors(doc, errors) {
  const fieldIds = ['owner-name', 'owner-email', 'dog-name', 'service-tier', 'walk-date', 'walk-notes'];
  let firstInvalidEl = null;

  for (const fieldId of fieldIds) {
    const fieldEl = doc.getElementById(fieldId);
    const errorEl = doc.querySelector(`[data-error-for="${fieldId}"]`);
    const message = errors[fieldId] || '';

    if (fieldEl) {
      if (message) {
        fieldEl.setAttribute('aria-invalid', 'true');
        if (!firstInvalidEl) {
          firstInvalidEl = fieldEl;
        }
      } else {
        fieldEl.removeAttribute('aria-invalid');
      }
    }

    if (errorEl) {
      errorEl.textContent = message;
    }
  }

  return firstInvalidEl;
}

function renderRequests(doc, requests) {
  const emptyStateEl = doc.querySelector('[data-testid="empty-state"]');
  const listEl = doc.querySelector('[data-testid="request-list"]');

  if (!listEl) {
    return;
  }

  listEl.replaceChildren();

  if (requests.length === 0) {
    if (emptyStateEl) {
      emptyStateEl.hidden = false;
    }
    return;
  }

  if (emptyStateEl) {
    emptyStateEl.hidden = true;
  }

  for (const request of requests) {
    const item = doc.createElement('li');
    item.className = 'request-item';

    const title = doc.createElement('p');
    title.className = 'request-item-title';
    const serviceLabel = SERVICE_LABELS[request.serviceTier] || request.serviceTier;
    title.textContent = `${request.dogName} — ${serviceLabel}`;

    const meta = doc.createElement('p');
    meta.className = 'request-item-meta';
    meta.textContent = `Owner: ${request.ownerName} (${request.ownerEmail}) • Date: ${request.walkDate}`;

    item.append(title, meta);

    if (request.notes) {
      const notes = doc.createElement('p');
      notes.className = 'request-item-notes';
      notes.textContent = `Notes: ${request.notes}`;
      item.append(notes);
    }

    listEl.append(item);
  }
}

/**
 * Initializes interactive booking-form demonstration state and handlers.
 */
export function initApp(doc = document, options = {}) {
  const form = doc.querySelector('#booking-form');
  if (!form) {
    return { getState: () => ({ requests: [], isSubmitting: false }) };
  }

  const previousAbort = activeControllers.get(form);
  if (previousAbort) {
    previousAbort.abort();
  }

  const abortController = new AbortController();
  activeControllers.set(form, abortController);

  const submitDelayMs = typeof options.submitDelayMs === 'number' ? options.submitDelayMs : 350;
  const submitButton = form.querySelector('button[type="submit"]');
  const loadingIndicator = doc.querySelector('[data-testid="loading-indicator"]');
  const statusBanner = doc.querySelector('[data-testid="form-status"]');

  const state = {
    requests: [],
    isSubmitting: false
  };

  function setLoading(isLoading) {
    state.isSubmitting = isLoading;
    form.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    if (submitButton) {
      submitButton.disabled = isLoading;
    }
    if (loadingIndicator) {
      loadingIndicator.hidden = !isLoading;
    }
  }

  renderRequests(doc, state.requests);
  setLoading(false);

  form.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault();

      if (state.isSubmitting) {
        return;
      }

      const sanitizedValues = {
        ownerName: sanitizeInput(doc.querySelector('#owner-name')?.value),
        ownerEmail: sanitizeInput(doc.querySelector('#owner-email')?.value),
        dogName: sanitizeInput(doc.querySelector('#dog-name')?.value),
        serviceTier: sanitizeInput(doc.querySelector('#service-tier')?.value),
        walkDate: sanitizeInput(doc.querySelector('#walk-date')?.value),
        notes: sanitizeInput(doc.querySelector('#walk-notes')?.value)
      };

      const errors = validateFields(sanitizedValues);
      const firstInvalidEl = applyFieldErrors(doc, errors);

      if (Object.keys(errors).length > 0) {
        if (statusBanner) {
          statusBanner.textContent = 'Please correct the highlighted fields before submitting.';
        }
        firstInvalidEl?.focus?.();
        return;
      }

      setLoading(true);
      if (statusBanner) {
        statusBanner.textContent = 'Submitting walk request demonstration...';
      }

      await new Promise((resolve) => setTimeout(resolve, submitDelayMs));

      const newRequest = {
        id: `req-${state.requests.length + 1}`,
        ...sanitizedValues
      };

      state.requests = [...state.requests, newRequest];
      renderRequests(doc, state.requests);
      form.reset();
      setLoading(false);

      if (statusBanner) {
        statusBanner.textContent = `Demo request recorded for ${newRequest.dogName}.`;
      }

      console.log(ANALYTICS_MESSAGE);
    },
    { signal: abortController.signal }
  );

  return {
    getState() {
      return {
        isSubmitting: state.isSubmitting,
        requests: state.requests.map((item) => ({ ...item }))
      };
    }
  };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initApp(document));
  } else if (document.querySelector('#booking-form')) {
    initApp(document);
  }
}
