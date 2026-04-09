export const createFadeUpObserver = ({
    selector = '.fade-up',
    fadeClass = 'fade-up',
    visibleClass = 'visible',
    threshold = 0.1,
    rootMargin = '0px 0px -60px 0px'
} = {}) => {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add(visibleClass);
        });

        return {
            observeElement: (element) => {
                if (!element) {
                    return;
                }

                element.classList.add(fadeClass, visibleClass);
            }
        };
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add(visibleClass);
            observer.unobserve(entry.target);
        });
    }, {
        threshold,
        rootMargin
    });

    document.querySelectorAll(selector).forEach(element => observer.observe(element));

    return {
        observeElement: (element) => {
            if (!element) {
                return;
            }

            element.classList.add(fadeClass);
            observer.observe(element);
        }
    };
};
