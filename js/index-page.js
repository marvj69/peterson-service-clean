import { initMobileNavigation, initNavbarScrollState } from './modules/navigation.js';
import { createFadeUpObserver } from './modules/scroll-reveal.js';

initMobileNavigation({
    collapseWidth: 768
});

initNavbarScrollState({
    threshold: 50
});

const { observeElement } = createFadeUpObserver({
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
});

const googleMapsApiKeyMeta = document.querySelector('meta[name="google-maps-api-key"]');
const configuredGoogleMapsApiKey = typeof window.PETERSON_GOOGLE_MAPS_API_KEY === 'string'
    ? window.PETERSON_GOOGLE_MAPS_API_KEY
    : googleMapsApiKeyMeta?.content || '';

const GOOGLE_REVIEWS_SETTINGS = {
    apiKey: configuredGoogleMapsApiKey.trim(),
    placeId: '',
    queries: [
        '+19062817318',
        'Peterson Service LLC Atlantic Mine MI 49905',
        '15984 3rd Street Atlantic Mine MI 49905'
    ],
    language: 'en-US',
    region: 'us',
    maxReviews: 3
};

const reviewsSummary = document.getElementById('reviewsSummary');
const reviewsRatingValue = document.getElementById('reviewsRatingValue');
const reviewsOverallStars = document.getElementById('reviewsOverallStars');
const reviewsBusinessName = document.getElementById('reviewsBusinessName');
const reviewsMeta = document.getElementById('reviewsMeta');
const reviewsLink = document.getElementById('reviewsLink');
const reviewsStatus = document.getElementById('reviewsStatus');
const reviewsCarousel = document.getElementById('reviewsCarousel');
const reviewsViewport = document.getElementById('reviewsViewport');
const reviewsGrid = document.getElementById('reviewsGrid');
const reviewsPrev = document.getElementById('reviewsPrev');
const reviewsNext = document.getElementById('reviewsNext');
const reviewsPagination = document.getElementById('reviewsPagination');
const reviewsCarouselProgress = document.getElementById('reviewsCarouselProgress');
const reviewsReducedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;
const REVIEWS_AUTOPLAY_DELAY = 4500;
let googleMapsScriptPromise;
let activeReviewIndex = 0;
let reviewsAutoplayTimer = 0;
let reviewsScrollFrame = 0;

const setReviewsStatus = (message, hidden = false) => {
    if (!reviewsStatus) {
        return;
    }

    reviewsStatus.textContent = message;
    reviewsStatus.hidden = hidden || !message;
};

const observeFadeUpElement = (element) => {
    if (!element) {
        return;
    }

    element.classList.add('fade-up');
    observeElement(element);
};

const normalizeReviewText = (value) => (value || '').replace(/\s+/g, ' ').trim();
const shortenReviewText = (value, maxLength = 420) => {
    const normalized = normalizeReviewText(value);

    if (normalized.length <= maxLength) {
        return normalized;
    }

    return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
};

const normalizeMatchText = (value) => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const formatRatingValue = (value) => Number.isFinite(value) ? value.toFixed(1) : '5.0';
const formatReviewCount = (count) => {
    const safeCount = Number.isFinite(count) ? count : 0;
    return `${safeCount.toLocaleString()} Google ${safeCount === 1 ? 'review' : 'reviews'}`;
};

const getReviewSlides = () => reviewsGrid ? Array.from(reviewsGrid.children) : [];
const getWrappedReviewIndex = (index, slideCount) => {
    if (!slideCount) {
        return 0;
    }

    return ((index % slideCount) + slideCount) % slideCount;
};
const getReviewSlideLabel = (slide, index) => {
    const reviewHeading = slide.querySelector('.testimonial-author-info h4')?.textContent?.trim();

    return reviewHeading || `Review ${index + 1}`;
};

const stopReviewsAutoplay = () => {
    if (!reviewsAutoplayTimer) {
        return;
    }

    window.clearTimeout(reviewsAutoplayTimer);
    reviewsAutoplayTimer = 0;
};

const shouldAutoplayReviews = () => {
    const slides = getReviewSlides();

    return Boolean(
        reviewsCarousel
        && reviewsViewport
        && slides.length > 1
        && !reviewsReducedMotionQuery?.matches
        && !document.hidden
    );
};

const startReviewsAutoplay = () => {
    stopReviewsAutoplay();

    if (!shouldAutoplayReviews()) {
        return;
    }

    reviewsAutoplayTimer = window.setTimeout(() => {
        scrollToReview(activeReviewIndex + 1, 'smooth', { wrap: true });
        startReviewsAutoplay();
    }, REVIEWS_AUTOPLAY_DELAY);
};

const resetReviewsAutoplay = () => {
    startReviewsAutoplay();
};

const updateReviewsCarouselUi = () => {
    const slides = getReviewSlides();
    const hasSlides = slides.length > 0;
    const hasMultipleSlides = slides.length > 1;

    if (reviewsCarouselProgress) {
        reviewsCarouselProgress.hidden = !hasSlides;
        reviewsCarouselProgress.textContent = hasSlides
            ? `${activeReviewIndex + 1} / ${slides.length}`
            : '';
    }

    if (reviewsPrev) {
        reviewsPrev.hidden = !hasMultipleSlides;
        reviewsPrev.disabled = !hasMultipleSlides;
    }

    if (reviewsNext) {
        reviewsNext.hidden = !hasMultipleSlides;
        reviewsNext.disabled = !hasMultipleSlides;
    }

    if (!reviewsPagination) {
        return;
    }

    reviewsPagination.hidden = !hasMultipleSlides;

    Array.from(reviewsPagination.children).forEach((dot, index) => {
        dot.classList.toggle('is-active', index === activeReviewIndex);
        dot.setAttribute('aria-current', index === activeReviewIndex ? 'true' : 'false');
    });
};

const getClosestReviewIndex = () => {
    const slides = getReviewSlides();

    if (!slides.length || !reviewsViewport) {
        return 0;
    }

    const viewportRect = reviewsViewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + (viewportRect.width / 2);
    let closestIndex = 0;
    let smallestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
        const slideRect = slide.getBoundingClientRect();
        const slideCenter = slideRect.left + (slideRect.width / 2);
        const distance = Math.abs(slideCenter - viewportCenter);

        if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
};

const scrollToReview = (index, behavior = 'smooth', { wrap = false } = {}) => {
    const slides = getReviewSlides();
    const safeIndex = wrap
        ? getWrappedReviewIndex(index, slides.length)
        : Math.max(0, Math.min(index, slides.length - 1));
    const targetSlide = slides[safeIndex];
    const shouldJumpAcrossLoop = wrap
        && slides.length > 1
        && (
            (activeReviewIndex === slides.length - 1 && safeIndex === 0)
            || (activeReviewIndex === 0 && safeIndex === slides.length - 1)
        );

    if (!targetSlide || !reviewsViewport) {
        return;
    }

    const viewportRect = reviewsViewport.getBoundingClientRect();
    const slideRect = targetSlide.getBoundingClientRect();
    const targetScrollLeft = reviewsViewport.scrollLeft + (slideRect.left - viewportRect.left);

    activeReviewIndex = safeIndex;
    reviewsViewport.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: shouldJumpAcrossLoop ? 'auto' : behavior
    });
    updateReviewsCarouselUi();
};

const buildReviewsPagination = () => {
    const slides = getReviewSlides();

    if (!reviewsPagination) {
        return;
    }

    reviewsPagination.innerHTML = '';

    slides.forEach((slide, index) => {
        const dot = document.createElement('button');

        dot.type = 'button';
        dot.className = 'reviews-pagination-button';
        dot.setAttribute('aria-label', `Show ${getReviewSlideLabel(slide, index)}`);
        dot.addEventListener('click', () => {
            scrollToReview(index);
            resetReviewsAutoplay();
        });
        reviewsPagination.appendChild(dot);
    });
};

const refreshReviewsCarousel = ({ resetIndex = false } = {}) => {
    const slides = getReviewSlides();

    if (!reviewsCarousel || !reviewsViewport || !slides.length) {
        stopReviewsAutoplay();
        updateReviewsCarouselUi();
        return;
    }

    if (resetIndex || activeReviewIndex >= slides.length) {
        activeReviewIndex = 0;
    }

    buildReviewsPagination();

    window.requestAnimationFrame(() => {
        scrollToReview(activeReviewIndex, 'auto');
        startReviewsAutoplay();
    });
};

const initializeReviewsCarousel = () => {
    if (!reviewsCarousel || !reviewsViewport || !reviewsGrid) {
        return;
    }

    const stepReviews = (step) => {
        scrollToReview(activeReviewIndex + step, 'smooth', { wrap: true });
        resetReviewsAutoplay();
    };

    reviewsPrev?.addEventListener('click', () => {
        stepReviews(-1);
    });

    reviewsNext?.addEventListener('click', () => {
        stepReviews(1);
    });

    reviewsViewport.addEventListener('scroll', () => {
        if (reviewsScrollFrame) {
            return;
        }

        reviewsScrollFrame = window.requestAnimationFrame(() => {
            activeReviewIndex = getClosestReviewIndex();
            updateReviewsCarouselUi();
            reviewsScrollFrame = 0;
        });
    }, { passive: true });

    reviewsViewport.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            stepReviews(-1);
        }

        if (event.key === 'ArrowRight') {
            event.preventDefault();
            stepReviews(1);
        }

        if (event.key === 'Home') {
            event.preventDefault();
            scrollToReview(0);
            resetReviewsAutoplay();
        }

        if (event.key === 'End') {
            event.preventDefault();
            scrollToReview(getReviewSlides().length - 1);
            resetReviewsAutoplay();
        }
    });

    reviewsCarousel.addEventListener('pointerenter', stopReviewsAutoplay);
    reviewsCarousel.addEventListener('pointerleave', startReviewsAutoplay);
    reviewsCarousel.addEventListener('focusin', stopReviewsAutoplay);
    reviewsCarousel.addEventListener('focusout', (event) => {
        if (!reviewsCarousel.contains(event.relatedTarget)) {
            startReviewsAutoplay();
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopReviewsAutoplay();
            return;
        }

        startReviewsAutoplay();
    });

    const handleReducedMotionChange = () => {
        if (reviewsReducedMotionQuery?.matches) {
            stopReviewsAutoplay();
            return;
        }

        startReviewsAutoplay();
    };

    if (typeof reviewsReducedMotionQuery?.addEventListener === 'function') {
        reviewsReducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    } else if (typeof reviewsReducedMotionQuery?.addListener === 'function') {
        reviewsReducedMotionQuery.addListener(handleReducedMotionChange);
    }

    window.addEventListener('resize', () => {
        scrollToReview(activeReviewIndex, 'auto');
        resetReviewsAutoplay();
    });

    refreshReviewsCarousel({ resetIndex: true });
};

const createStarIcon = (filled) => {
    const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    star.setAttribute('viewBox', '0 0 24 24');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    star.style.fill = filled ? '#f59e0b' : 'rgba(245, 158, 11, 0.18)';
    star.appendChild(path);

    return star;
};

const setStars = (container, rating, label) => {
    if (!container) {
        return;
    }

    const roundedRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    container.innerHTML = '';

    for (let starIndex = 1; starIndex <= 5; starIndex += 1) {
        container.appendChild(createStarIcon(starIndex <= roundedRating));
    }

    if (label) {
        container.setAttribute('aria-label', label);
    }
};

const scorePlaceMatch = (place) => {
    const normalizedName = normalizeMatchText(place.displayName);
    const normalizedAddress = normalizeMatchText(place.formattedAddress);
    let score = 0;

    if (normalizedName.includes('peterson service')) {
        score += 12;
    }

    if (normalizedName.includes('peterson')) {
        score += 6;
    }

    if (normalizedName.includes('service')) {
        score += 4;
    }

    if (normalizedAddress.includes('atlantic mine')) {
        score += 6;
    }

    if (normalizedAddress.includes('49905')) {
        score += 3;
    }

    if (normalizedAddress.includes('3rd street')) {
        score += 3;
    }

    if (Number.isFinite(place.rating)) {
        score += Math.min(place.rating, 5);
    }

    return score;
};

const pickBestMatchingPlace = (places = []) => {
    const rankedPlaces = places
        .map(place => ({ place, score: scorePlaceMatch(place) }))
        .sort((firstPlace, secondPlace) => secondPlace.score - firstPlace.score);

    return rankedPlaces[0] && rankedPlaces[0].score >= 10
        ? rankedPlaces[0].place
        : null;
};

const loadGoogleMapsPlacesApi = () => {
    if (window.google?.maps?.importLibrary) {
        return Promise.resolve(window.google.maps);
    }

    if (googleMapsScriptPromise) {
        return googleMapsScriptPromise;
    }

    googleMapsScriptPromise = new Promise((resolve, reject) => {
        const callbackName = '__petersonGoogleReviewsReady';
        const script = document.createElement('script');
        const params = new URLSearchParams({
            key: GOOGLE_REVIEWS_SETTINGS.apiKey,
            loading: 'async',
            callback: callbackName,
            libraries: 'places',
            language: GOOGLE_REVIEWS_SETTINGS.language,
            region: GOOGLE_REVIEWS_SETTINGS.region,
            v: 'weekly',
            auth_referrer_policy: 'origin'
        });

        window[callbackName] = () => {
            delete window[callbackName];
            resolve(window.google.maps);
        };

        script.async = true;
        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
        script.onerror = () => {
            delete window[callbackName];
            googleMapsScriptPromise = null;
            reject(new Error('Google Maps JavaScript API failed to load.'));
        };

        document.head.appendChild(script);
    });

    return googleMapsScriptPromise;
};

const resolvePetersonPlace = async (Place) => {
    if (GOOGLE_REVIEWS_SETTINGS.placeId) {
        return new Place({ id: GOOGLE_REVIEWS_SETTINGS.placeId });
    }

    for (const query of GOOGLE_REVIEWS_SETTINGS.queries) {
        const { places } = await Place.searchByText({
            textQuery: query,
            fields: ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount'],
            language: GOOGLE_REVIEWS_SETTINGS.language,
            region: GOOGLE_REVIEWS_SETTINGS.region,
            maxResultCount: 5
        });
        const matchedPlace = pickBestMatchingPlace(places);

        if (matchedPlace?.id) {
            return new Place({ id: matchedPlace.id });
        }
    }

    return null;
};

const createReviewCard = (review) => {
    const card = document.createElement('article');
    const stars = document.createElement('div');
    const quote = document.createElement('p');
    const authorWrap = document.createElement('div');
    const authorBadge = document.createElement('div');
    const authorInfo = document.createElement('div');
    const authorHeading = document.createElement('h4');
    const authorMeta = document.createElement('p');
    const authorName = review.authorAttribution?.displayName || 'Google reviewer';
    const authorProfileUri = review.authorAttribution?.uri;
    const authorPhotoUri = review.authorAttribution?.photoURI;

    card.className = 'testimonial-card';
    stars.className = 'testimonial-stars';
    quote.className = 'testimonial-quote';
    authorWrap.className = 'testimonial-author';
    authorBadge.className = 'testimonial-author-icon';
    authorInfo.className = 'testimonial-author-info';

    setStars(
        stars,
        review.rating,
        `${review.rating || 0} out of 5 stars`
    );

    quote.textContent = `"${shortenReviewText(review.text)}"`;

    if (authorPhotoUri) {
        const authorImage = document.createElement('img');

        authorImage.src = authorPhotoUri;
        authorImage.alt = `${authorName} profile photo`;
        authorImage.loading = 'lazy';
        authorBadge.classList.add('has-photo');
        authorBadge.appendChild(authorImage);
    } else {
        authorBadge.textContent = authorName.charAt(0).toUpperCase() || 'G';
    }

    if (authorProfileUri) {
        const authorLinkElement = document.createElement('a');

        authorLinkElement.href = authorProfileUri;
        authorLinkElement.target = '_blank';
        authorLinkElement.rel = 'noopener noreferrer';
        authorLinkElement.textContent = authorName;
        authorHeading.appendChild(authorLinkElement);
    } else {
        authorHeading.textContent = authorName;
    }

    authorMeta.textContent = review.relativePublishTimeDescription || 'Google review';

    authorInfo.append(authorHeading, authorMeta);
    authorWrap.append(authorBadge, authorInfo);
    card.append(stars, quote, authorWrap);

    observeFadeUpElement(card);

    return card;
};

const renderGoogleReviewSummary = (place) => {
    if (!reviewsSummary || !reviewsBusinessName || !reviewsMeta || !reviewsRatingValue) {
        return;
    }

    reviewsBusinessName.textContent = place.displayName || 'Peterson Service L.L.C.';
    reviewsRatingValue.textContent = formatRatingValue(place.rating);
    reviewsMeta.textContent = place.userRatingCount
        ? `${formatReviewCount(place.userRatingCount)}${place.formattedAddress ? ` - ${place.formattedAddress}` : ''}`
        : place.formattedAddress || 'Live Google reviews';

    if (reviewsLink && place.googleMapsURI) {
        reviewsLink.href = place.googleMapsURI;
    }

    setStars(
        reviewsOverallStars,
        place.rating,
        `${formatRatingValue(place.rating)} out of 5 stars overall`
    );

    reviewsSummary.hidden = false;
    observeFadeUpElement(reviewsSummary);
};

const initializeGoogleReviews = async () => {
    if (!reviewsGrid) {
        return;
    }

    if (!GOOGLE_REVIEWS_SETTINGS.apiKey) {
        console.info('Add a browser-restricted Google Maps API key to the google-maps-api-key meta tag to enable live reviews.');
        return;
    }

    try {
        setReviewsStatus('Loading latest Google reviews...');
        await loadGoogleMapsPlacesApi();

        const { Place } = await window.google.maps.importLibrary('places');
        const place = await resolvePetersonPlace(Place);

        if (!place) {
            throw new Error('No matching Google Business Profile was found.');
        }

        await place.fetchFields({
            fields: [
                'displayName',
                'formattedAddress',
                'googleMapsURI',
                'rating',
                'userRatingCount',
                'reviews'
            ]
        });

        const liveReviews = (place.reviews || [])
            .filter(review => normalizeReviewText(review.text))
            .sort((firstReview, secondReview) => {
                const firstTimestamp = firstReview.publishTime?.getTime() || 0;
                const secondTimestamp = secondReview.publishTime?.getTime() || 0;
                return secondTimestamp - firstTimestamp;
            })
            .slice(0, GOOGLE_REVIEWS_SETTINGS.maxReviews);

        if (!liveReviews.length) {
            throw new Error('The Google Business Profile does not currently expose review text.');
        }

        renderGoogleReviewSummary(place);
        reviewsGrid.innerHTML = '';
        liveReviews.forEach(review => reviewsGrid.appendChild(createReviewCard(review)));
        refreshReviewsCarousel({ resetIndex: true });
        setReviewsStatus('', true);
    } catch (error) {
        console.error('Unable to load live Google reviews.', error);
        setReviewsStatus('', true);
    }
};

initializeReviewsCarousel();
initializeGoogleReviews();

const focusFirstContactFieldAfterScroll = () => {
    const firstContactField = document.getElementById('lead-name');
    if (!firstContactField) {
        return;
    }

    const scrollCompleteFallback = () => {
        let stableFrames = 0;
        let previousY = window.scrollY;

        const checkIfSettled = () => {
            const currentY = window.scrollY;
            const delta = Math.abs(currentY - previousY);

            if (delta < 1) {
                stableFrames += 1;
            } else {
                stableFrames = 0;
            }

            previousY = currentY;

            if (stableFrames >= 6) {
                firstContactField.focus({ preventScroll: true });
                return;
            }

            window.requestAnimationFrame(checkIfSettled);
        };

        window.requestAnimationFrame(checkIfSettled);
    };

    if ('onscrollend' in window) {
        const handleScrollEnd = () => {
            firstContactField.focus({ preventScroll: true });
            window.removeEventListener('scrollend', handleScrollEnd);
        };

        window.addEventListener('scrollend', handleScrollEnd, { once: true });
        return;
    }

    scrollCompleteFallback();
};

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (event) {
        const href = this.getAttribute('href');
        if (!href || href === '#') {
            return;
        }

        const target = document.querySelector(href);
        if (!target) {
            return;
        }

        event.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        if (href === '#contact') {
            focusFirstContactFieldAfterScroll();
        }
    });
});

const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}, { passive: true });

const leadForm = document.getElementById('leadForm');
const preferredContactField = document.getElementById('lead-preferred-contact');
const phoneField = document.getElementById('lead-phone');
const leadFormSubjectField = leadForm ? leadForm.querySelector('[name="subject"]') : null;
const leadFormSourceField = leadForm ? leadForm.querySelector('[name="submitted_from"]') : null;
const leadFormWebsiteField = leadForm ? leadForm.querySelector('[name="website"]') : null;

if (leadForm && preferredContactField && phoneField) {
    const hostLabel = window.location.hostname || 'Peterson Service website';

    if (leadFormSubjectField) {
        leadFormSubjectField.value = `New Peterson Service lead from ${hostLabel}`;
    }

    if (leadFormWebsiteField) {
        leadFormWebsiteField.value = hostLabel;
    }

    if (leadFormSourceField) {
        leadFormSourceField.value = window.location.protocol === 'file:'
            ? 'Local file preview (file://). Submit from localhost or the live site to avoid Formspree labeling the source as null.'
            : window.location.href;
    }

    const syncPhoneRequirement = () => {
        const needsPhone = preferredContactField.value === 'call' || preferredContactField.value === 'text';
        phoneField.required = needsPhone;

        if (needsPhone) {
            phoneField.setAttribute('aria-describedby', 'leadPhoneHelp');
        } else {
            phoneField.removeAttribute('aria-describedby');
        }

        if (needsPhone && !phoneField.value.trim()) {
            phoneField.setCustomValidity('Add a phone number if you want a call or text back.');
        } else {
            phoneField.setCustomValidity('');
        }
    };

    preferredContactField.addEventListener('change', syncPhoneRequirement);
    phoneField.addEventListener('input', syncPhoneRequirement);
    leadForm.addEventListener('submit', syncPhoneRequirement);
    leadForm.addEventListener('reset', () => {
        window.requestAnimationFrame(syncPhoneRequirement);
    });
    syncPhoneRequirement();

    window.formspree = window.formspree || function () {
        (window.formspree.q = window.formspree.q || []).push(arguments);
    };
    window.formspree('initForm', { formElement: '#leadForm', formId: 'mdapbvwe' });
}
