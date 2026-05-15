// Tera Dashboard Interactivity
document.addEventListener('DOMContentLoaded', () => {
    console.log('Tera Infrastructure Online');

    // Add click ripple effect to buttons (Optional enhancement)
    const buttons = document.querySelectorAll('button, a');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Logic for visual feedback
            this.classList.add('active:scale-95');
            setTimeout(() => this.classList.remove('active:scale-95'), 100);
        });
    });

    // Intersection Observer for fade-in animations on activity items
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    document.querySelectorAll('.activity-item').forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'all 0.4s ease-out';
        observer.observe(item);
    });
});
