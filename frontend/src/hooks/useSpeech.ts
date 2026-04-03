import * as Speech from 'expo-speech';
import { useCallback } from 'react';

export const useSpeech = () => {
  const speak = useCallback((text: string, options?: Speech.SpeechOptions) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
      ...options,
    });
  }, []);
  
  const speakReminder = useCallback((itemName: string) => {
    const messages = [
      `Hey! Don't forget your ${itemName}!`,
      `Remember to take your ${itemName}!`,
      `Wait! Did you grab your ${itemName}?`,
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    speak(message);
  }, [speak]);
  
  const speakSuccess = useCallback(() => {
    const messages = [
      "Great job! You've got everything!",
      "Perfect! Nothing forgotten today!",
      "Awesome! You're all set!",
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    speak(message);
  }, [speak]);
  
  const stop = useCallback(() => {
    Speech.stop();
  }, []);
  
  return { speak, speakReminder, speakSuccess, stop };
};
