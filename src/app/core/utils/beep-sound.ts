// Simple notification sound using Web Audio API
export function playBeep() {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Double beep notification
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);

        // Second beep
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';

        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

        oscillator2.start(audioContext.currentTime + 0.15);
        oscillator2.stop(audioContext.currentTime + 0.25);

        console.log('✅ Beep sound played');
    } catch (error) {
        console.error('❌ Failed to play beep:', error);
    }
}
