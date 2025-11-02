// Simple, beginner-friendly script to fetch APOD data, render a gallery,
// and show a modal with a larger image, title, date, and explanation.

// Use this URL to fetch NASA APOD JSON data.
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Get references to DOM elements (may be null if script runs before DOM loads)
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// "Did you know?" facts shown above the gallery. We store facts in an array
// and pick one at random each time the script runs (page load/refresh).
const spaceFacts = [
  "Venus spins backward compared to most planets — the Sun rises in the west there.",
  "A day on Venus (one rotation) is longer than a year on Venus (one orbit).",
  "Neutron stars are so dense that a teaspoon of their material would weigh about a billion tons on Earth.",
  "Jupiter's Great Red Spot is a gigantic storm larger than Earth that has raged for centuries.",
  "There are more stars in the observable universe than grains of sand on all Earth's beaches combined.",
  "Saturn could float in water because its average density is less than water.",
  "The largest volcano in the solar system is Olympus Mons on Mars — it's about three times taller than Mount Everest.",
  "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.",
  "A year on Mercury only lasts 88 Earth days.",
  "The Moon is slowly moving away from Earth at about 3.8 centimeters per year."
];

function showRandomFact() {
  // Prefer inserting before the gallery if possible
  const id = 'did-you-know';
  let factSection = document.getElementById(id);

  // Create section if it doesn't exist
    if (!factSection) {
    factSection = document.createElement('section');
    factSection.id = id;
    factSection.className = 'did-you-know';
    const h2 = document.createElement('h2');
    h2.textContent = 'Did you know?';
    const p = document.createElement('p');
    factSection.appendChild(h2);
    factSection.appendChild(p);

    // Center the fact section visually. Using inline styles keeps this change
    // small and avoids editing the project's CSS file.
    factSection.style.textAlign = 'center';
    factSection.style.maxWidth = '720px';
    factSection.style.margin = '1.25rem auto';
    factSection.style.padding = '0.5rem 1rem';

    // Add a small gap between the heading and paragraph for readability.
    // We set the heading's bottom margin and ensure the paragraph has a small
    // top margin so the spacing is consistent across browsers.
    h2.style.margin = '0 0 0.5rem 0';
    p.style.margin = '0.25rem 0 0 0';

    if (gallery && gallery.parentNode) {
      gallery.parentNode.insertBefore(factSection, gallery);
    } else {
      // fallback: put at top of body
      document.body.insertBefore(factSection, document.body.firstChild);
    }
  }

  const pEl = factSection.querySelector('p') || factSection.appendChild(document.createElement('p'));
  const idx = Math.floor(Math.random() * spaceFacts.length);
  pEl.textContent = spaceFacts[idx] || 'Space is full of surprises!';
}

// Show a random fact right away so it's visible on page load
showRandomFact();

// Modal elements
const modal = document.getElementById('modal');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDate = document.getElementById('modal-date');
const modalExplanation = document.getElementById('modal-explanation');
const modalCloseBtn = document.querySelector('.modal-close');
const modalOverlay = document.querySelector('.modal-overlay');

// Open modal and populate with item data
function openModal(item) {
  if (!item || !modal) return;

  // Remove any existing video iframe from a previous open
  const previousIframe = document.getElementById('modal-video');
  if (previousIframe) previousIframe.remove();

  // Fill modal fields with safe fallbacks and handle video vs image
  if (item.media_type === 'video') {
    // hide the image element when showing a video
    if (modalImage) modalImage.style.display = 'none';

    // Create an iframe for the video embed (APOD provides embed URLs for YouTube)
    const iframe = document.createElement('iframe');
    iframe.id = 'modal-video';
    iframe.src = item.url || item.thumbnail_url || '';
    iframe.width = '100%';
    iframe.height = '420';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');

    // Insert the iframe next to the existing modal image if possible
    if (modalImage && modalImage.parentNode) {
      modalImage.parentNode.insertBefore(iframe, modalImage.nextSibling);
    } else {
      modal.appendChild(iframe);
    }
  } else {
    // image case: ensure iframe removed and show image
    if (modalImage) {
      modalImage.style.display = '';
      // prefer hdurl when available
      modalImage.src = item.hdurl || item.url || '';
      modalImage.alt = item.title || 'Space image';
    }
  }
  if (modalTitle) modalTitle.textContent = item.title || 'Untitled';
  if (modalDate) modalDate.textContent = item.date || '';
  if (modalExplanation) modalExplanation.textContent = item.explanation || '';

  // Show modal and prevent background scroll
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Optional: focus close button for accessibility
  if (modalCloseBtn) modalCloseBtn.focus();
}

// Close modal and clear heavy resources
function closeModal() {
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');

  // Remove any embedded iframe used for video playback
  const previousIframe = document.getElementById('modal-video');
  if (previousIframe) previousIframe.remove();

  // Clear image src to stop downloads/animations and make sure image is visible
  if (modalImage) {
    modalImage.src = '';
    modalImage.style.display = '';
  }

  document.body.style.overflow = '';
}

// Wire modal close interactions (only if elements exist)
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeModal);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    // overlay may have data-close attribute on the element meant to close
    const shouldClose = e.target && e.target.dataset && e.target.dataset.close;
    if (shouldClose) closeModal();
  });
}

// Close modal with Escape key when modal is open
window.addEventListener('keydown', (e) => {
  if (!modal) return;
  if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
    closeModal();
  }
});

// When the button is clicked, fetch the data and build the gallery
if (getImageBtn) {
  getImageBtn.addEventListener('click', async () => {
    if (!gallery) return;

    // Show a simple loading message while fetching
    gallery.innerHTML = `<p class="loading">🔄 Loading space photos…</p>`;

    try {
      // Fetch the JSON data from the APOD dataset
      const response = await fetch(apodData);
      if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
      }

      // Parse the JSON into a JavaScript array
      const data = await response.json();

      // If no data, show a message
      if (!Array.isArray(data) || data.length === 0) {
        gallery.innerHTML = `<p>No images found.</p>`;
        return;
      }

      // Clear the gallery and build items for each image
      gallery.innerHTML = ''; // remove placeholder or previous content

      data.forEach((item) => {
        // Create container for the gallery item
        const itemEl = document.createElement('div');
        itemEl.className = 'gallery-item';

        // Determine if this entry is a video
        const isVideo = item.media_type && item.media_type === 'video';

        // Use thumbnail for videos when available, otherwise fall back to url
        const imgSrc = isVideo ? (item.thumbnail_url || item.url || '') : (item.url || '');

        // Image element (use lazy loading for performance)
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = item.title || 'Space image';
        img.loading = 'lazy';

        // Title element
        const title = document.createElement('h3');
        title.textContent = item.title || 'Untitled';

        // Date element
        const date = document.createElement('p');
        date.className = 'date';
        date.textContent = item.date || '';

        // If this is a video, add a play overlay so users know it's playable
        if (isVideo) {
          const overlay = document.createElement('span');
          overlay.className = 'play-overlay';
          overlay.setAttribute('aria-hidden', 'true');
          overlay.textContent = '▶';
          itemEl.appendChild(overlay);
        }

        // Assemble and append
        itemEl.appendChild(img);
        itemEl.appendChild(title);
        itemEl.appendChild(date);

        // Open modal when item clicked (pass the full item so explanation is available)
        itemEl.addEventListener('click', () => openModal(item));

        if (gallery) gallery.appendChild(itemEl);
      });
    } catch (error) {
      // Show an error message if something goes wrong
      gallery.innerHTML = `<p class="error">Error loading images: ${error.message}</p>`;
      console.error('Failed to load APOD data:', error);
    }
  });
}