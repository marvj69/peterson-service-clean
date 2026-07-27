import { initMobileNavigation, initNavbarScrollState } from './modules/navigation.js';
import { categoryMeta, galleryItems } from './gallery-data.js';

const heroCollage = document.getElementById('heroCollage');
const filterButtons = document.getElementById('filterButtons');
const galleryGrid = document.getElementById('galleryGrid');
const gallerySummary = document.getElementById('gallerySummary');
const galleryMediaCount = document.getElementById('galleryMediaCount');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxVideo = document.getElementById('lightboxVideo');
const lightboxChip = document.getElementById('lightboxChip');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxDescription = document.getElementById('lightboxDescription');
const lightboxCount = document.getElementById('lightboxCount');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxClose = document.getElementById('lightboxClose');

initMobileNavigation({
    collapseWidth: 780
});

initNavbarScrollState({
    threshold: 24
});

const orderedCategories = Object.keys(categoryMeta);
let activeFilter = 'all';
let visibleItems = [...galleryItems];
let currentLightboxIndex = 0;

const isVideoItem = item => item.type === 'video';
const getThumbnailSrc = item => item.poster || item.src;

const buildHeroCollage = () => {
    const featuredItems = galleryItems.filter(item => item.featured).slice(0, 4);
    heroCollage.innerHTML = featuredItems.map(item => `
        <article class="collage-card">
            <img src="${getThumbnailSrc(item)}" alt="${item.alt}" loading="lazy" decoding="async">
            <div class="collage-card-copy">
                <span class="collage-chip">${categoryMeta[item.category].label}</span>
                <h3>${item.title}</h3>
            </div>
        </article>
    `).join('');
};

const buildFilterButtons = () => {
    const allCount = galleryItems.length;
    const buttons = [
        {
            key: 'all',
            label: 'All Media',
            count: allCount
        },
        ...orderedCategories.map(key => ({
            key,
            label: categoryMeta[key].label,
            count: galleryItems.filter(item => item.category === key).length
        }))
    ];

    filterButtons.innerHTML = buttons.map(button => `
        <button
            type="button"
            class="filter-btn${button.key === activeFilter ? ' is-active' : ''}"
            data-filter="${button.key}"
            role="tab"
            aria-selected="${button.key === activeFilter}"
        >
            <span>${button.label}</span>
            <span class="filter-count">${button.count}</span>
        </button>
    `).join('');
};

const getFilteredItems = () => {
    if (activeFilter === 'all') {
        return [...galleryItems];
    }

    return galleryItems.filter(item => item.category === activeFilter);
};

const updateSummary = () => {
    if (activeFilter === 'all') {
        gallerySummary.textContent = `Showing all ${galleryItems.length} photos and videos across ${orderedCategories.length} service categories.`;
        return;
    }

    const currentLabel = categoryMeta[activeFilter].label;
    gallerySummary.textContent = `Showing ${visibleItems.length} media items in ${currentLabel}.`;
};

const renderGallery = () => {
    visibleItems = getFilteredItems();
    updateSummary();
    buildFilterButtons();

    galleryGrid.innerHTML = visibleItems.map((item, index) => {
        const video = isVideoItem(item);
        const mediaLabel = video ? 'video' : 'photo';

        return `
        <article class="gallery-card card-${item.size || 'standard'}">
            <button
                type="button"
                class="gallery-open"
                data-open-index="${index}"
                aria-label="Open ${mediaLabel}: ${item.title}"
            >
                <div class="gallery-media">
                    <img src="${getThumbnailSrc(item)}" alt="${item.alt}" loading="lazy" decoding="async">
                    ${video ? `
                        <span class="media-type-badge" aria-hidden="true">
                            <svg viewBox="0 0 24 24"><polygon points="8 5 19 12 8 19 8 5"/></svg>
                            Video
                        </span>
                    ` : ''}
                </div>
                <div class="gallery-copy">
                    <span class="gallery-chip">${categoryMeta[item.category].label}</span>
                    <h3>${item.title}</h3>
                    <p>${item.note}</p>
                    <span>
                        <svg viewBox="0 0 24 24">
                            ${video
                                ? '<polygon points="8 5 19 12 8 19 8 5"/>'
                                : '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'}
                        </svg>
                        ${video ? 'Watch video' : 'View full photo'}
                    </span>
                </div>
            </button>
        </article>
    `;
    }).join('');
};

const updateLightbox = () => {
    const item = visibleItems[currentLightboxIndex];
    if (!item) {
        return;
    }

    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.removeAttribute('poster');

    if (isVideoItem(item)) {
        lightboxImage.hidden = true;
        lightboxImage.removeAttribute('src');
        lightboxVideo.hidden = false;
        lightboxVideo.src = item.src;
        lightboxVideo.poster = item.poster || '';
        lightboxVideo.setAttribute('aria-label', item.alt);
        lightboxVideo.load();
    } else {
        lightboxVideo.hidden = true;
        lightboxVideo.removeAttribute('aria-label');
        lightboxImage.hidden = false;
        lightboxImage.src = item.src;
        lightboxImage.alt = item.alt;
    }

    lightboxChip.textContent = categoryMeta[item.category].label;
    lightboxTitle.textContent = item.title;
    lightboxDescription.textContent = item.note;
    lightboxCount.textContent = `${currentLightboxIndex + 1} / ${visibleItems.length}`;
};

const openLightbox = (index) => {
    currentLightboxIndex = index;
    updateLightbox();
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
};

const closeLightbox = () => {
    lightboxVideo.pause();
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
};

const stepLightbox = (direction) => {
    if (!visibleItems.length) {
        return;
    }

    currentLightboxIndex = (currentLightboxIndex + direction + visibleItems.length) % visibleItems.length;
    updateLightbox();
};

filterButtons.addEventListener('click', event => {
    const trigger = event.target.closest('[data-filter]');
    if (!trigger) {
        return;
    }

    activeFilter = trigger.getAttribute('data-filter');
    renderGallery();
});

galleryGrid.addEventListener('click', event => {
    const trigger = event.target.closest('[data-open-index]');
    if (!trigger) {
        return;
    }

    openLightbox(Number(trigger.getAttribute('data-open-index')));
});

lightboxPrev.addEventListener('click', () => stepLightbox(-1));
lightboxNext.addEventListener('click', () => stepLightbox(1));
lightboxClose.addEventListener('click', closeLightbox);

lightbox.addEventListener('click', event => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

document.addEventListener('keydown', event => {
    if (lightbox.hidden) {
        return;
    }

    if (event.key === 'Escape') {
        closeLightbox();
    }

    if (event.key === 'ArrowRight') {
        stepLightbox(1);
    }

    if (event.key === 'ArrowLeft') {
        stepLightbox(-1);
    }
});

let touchStartX = 0;
let touchEndX = 0;
lightbox.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0].screenX;
}, { passive: true });
lightbox.addEventListener('touchend', event => {
    touchEndX = event.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
        stepLightbox(diff > 0 ? 1 : -1);
    }
}, { passive: true });

buildHeroCollage();
buildFilterButtons();
renderGallery();

if (galleryMediaCount) {
    galleryMediaCount.textContent = galleryItems.length;
}
