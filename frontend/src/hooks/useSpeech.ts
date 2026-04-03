import * as Speech from 'expo-speech';
import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const LANGUAGE_MAP: Record<string, string> = {
  en: 'en-US',
  ar: 'ar-SA',
  ur: 'ur-PK',
  tr: 'tr-TR',
  es: 'es-ES',
};

export const useSpeech = () => {
  const { language, voiceEnabled } = useSettingsStore();

  const getSpeechLang = useCallback(() => {
    return LANGUAGE_MAP[language] || 'en-US';
  }, [language]);

  const speak = useCallback((text: string, options?: Speech.SpeechOptions) => {
    if (!voiceEnabled) return;
    
    // Stop any existing speech first
    Speech.stop();
    
    Speech.speak(text, {
      language: getSpeechLang(),
      pitch: 1.0,
      rate: 0.9,
      ...options,
    });
  }, [voiceEnabled, getSpeechLang]);
  
  const speakReminder = useCallback((itemName: string) => {
    if (!voiceEnabled) return;
    
    const messages: Record<string, string[]> = {
      en: [
        `Hey! Don't forget your ${itemName}!`,
        `Remember to take your ${itemName}!`,
        `Wait! Did you grab your ${itemName}?`,
      ],
      ar: [
        `لا تنسَ ${itemName}!`,
        `تذكر أن تأخذ ${itemName}!`,
        `انتظر! هل أخذت ${itemName}؟`,
      ],
      es: [
        `¡Oye! ¡No olvides tu ${itemName}!`,
        `¡Recuerda llevar tu ${itemName}!`,
        `¡Espera! ¿Agarraste tu ${itemName}?`,
      ],
      tr: [
        `Hey! ${itemName}'nı unutma!`,
        `${itemName}'nı almayı unutma!`,
        `Bekle! ${itemName}'nı aldın mı?`,
      ],
      ur: [
        `ارے! اپنا ${itemName} مت بھولیں!`,
        `اپنا ${itemName} لینا یاد رکھیں!`,
        `رکیں! کیا آپ نے ${itemName} لیا؟`,
      ],
    };
    
    const langMessages = messages[language] || messages.en;
    const message = langMessages[Math.floor(Math.random() * langMessages.length)];
    speak(message);
  }, [speak, language, voiceEnabled]);
  
  const speakSuccess = useCallback(() => {
    if (!voiceEnabled) return;
    
    const messages: Record<string, string[]> = {
      en: [
        "Great job! You've got everything!",
        "Perfect! Nothing forgotten today!",
        "Awesome! You're all set!",
      ],
      ar: [
        "أحسنت! لديك كل شيء!",
        "ممتاز! لم تنسَ شيئاً!",
        "رائع! أنت جاهز!",
      ],
      es: [
        "¡Buen trabajo! ¡Lo tienes todo!",
        "¡Perfecto! ¡Nada olvidado hoy!",
        "¡Genial! ¡Estás listo!",
      ],
      tr: [
        "Harika! Her şeyin yanında!",
        "Mükemmel! Bugün hiçbir şey unutulmadı!",
        "Süper! Hazırsın!",
      ],
      ur: [
        "بہت خوب! آپ کے پاس سب کچھ ہے!",
        "بہترین! آج کچھ نہیں بھولے!",
        "شاندار! آپ تیار ہیں!",
      ],
    };
    
    const langMessages = messages[language] || messages.en;
    const message = langMessages[Math.floor(Math.random() * langMessages.length)];
    speak(message);
  }, [speak, language, voiceEnabled]);
  
  const speakMultipleReminders = useCallback((itemNames: string[]) => {
    if (!voiceEnabled || itemNames.length === 0) return;
    
    const itemList = itemNames.join(', ');
    const messages: Record<string, string> = {
      en: `Watch out! You might be forgetting: ${itemList}`,
      ar: `انتبه! قد تنسى: ${itemList}`,
      es: `¡Cuidado! Podrías estar olvidando: ${itemList}`,
      tr: `Dikkat! Bunları unutuyor olabilirsin: ${itemList}`,
      ur: `محتاط رہیں! آپ بھول سکتے ہیں: ${itemList}`,
    };
    
    speak(messages[language] || messages.en);
  }, [speak, language, voiceEnabled]);
  
  const stop = useCallback(() => {
    Speech.stop();
  }, []);
  
  return { speak, speakReminder, speakSuccess, speakMultipleReminders, stop };
};
