const closeMobileMenu = (navLinks, mobileToggle) => {
    navLinks.classList.remove('active');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
};

export const initMobileNavigation = ({
    mobileToggleSelector = '#mobileToggle',
    navLinksSelector = '#navLinks',
    linkSelector = '.nav-links a',
    collapseWidth = 768
} = {}) => {
    const mobileToggle = document.querySelector(mobileToggleSelector);
    const navLinks = document.querySelector(navLinksSelector);

    if (!mobileToggle || !navLinks) {
        return;
    }

    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
        mobileToggle.setAttribute('aria-expanded', navLinks.classList.contains('active') ? 'true' : 'false');
    });

    document.querySelectorAll(linkSelector).forEach(link => {
        link.addEventListener('click', () => {
            if (!navLinks.classList.contains('active')) {
                return;
            }

            closeMobileMenu(navLinks, mobileToggle);
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= collapseWidth || !navLinks.classList.contains('active')) {
            return;
        }

        closeMobileMenu(navLinks, mobileToggle);
    });
};

export const initNavbarScrollState = ({
    navbarSelector = '#navbar',
    scrolledClass = 'scrolled',
    threshold = 24
} = {}) => {
    const navbar = document.querySelector(navbarSelector);

    if (!navbar) {
        return;
    }

    const syncScrollState = () => {
        navbar.classList.toggle(scrolledClass, window.scrollY > threshold);
    };

    window.addEventListener('scroll', syncScrollState, { passive: true });
    syncScrollState();
};
