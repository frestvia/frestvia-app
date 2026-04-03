# Forgetly – Smart Exit Checklist PRD

## App Overview
Mobile app for iOS/Android that helps users avoid forgetting important items when leaving places through smart checklists, voice reminders, and location awareness.

## Core Features (Implemented)
### Phase 1 - MVP (DONE)
- JWT-based Auth (Register/Login/Guest)
- Smart Checklists (Home Exit, Travel/Hotel, Office Exit + Custom)
- Exit Mode with interactive checklist checking
- Stats Dashboard with streaks, risk score, forgetting insights
- Exit History with date grouping
- Profile screen with stats summary
- Paywall screen for premium tier

### Phase 2 - Enhancement (DONE)
- Dark/Light Mode with system detection
- Multi-language: EN, AR (RTL), UR, TR, ES
- Forgetly branding throughout
- Premium test toggle (mock purchase)

### Phase 3 - Location & Voice (DONE)
- Location Management screen (Add/Delete locations with GPS)
- GPS detection via expo-location
- Location awareness on Home screen (nearby detection)
- Free tier limit (2 locations, unlimited for premium)
- Enhanced TTS with language-aware voice reminders
- Multi-language voice messages (EN/AR/ES/TR/UR)
- Voice settings integration with settingsStore
- Premium badge in Profile when premium is active

## Upcoming Features
- P1: Social Sharing (share stats as image card)
- P1: Smart Suggestions (auto-suggest based on history)
- P2: Background Geofencing (premium)
- P2: Push Notifications & Local Scheduling
- P3: Cloud Sync / Firebase Auth

## Tech Stack
- Frontend: Expo (React Native), expo-router, Zustand, react-i18next
- Backend: FastAPI, Motor (MongoDB), PyJWT
- Storage: AsyncStorage (local), MongoDB (server)
- Location: expo-location (foreground GPS)
- Speech: expo-speech (TTS)

## Premium Features
- Unlimited locations (free: 2)
- Advanced insights
- Background geofencing
- Unlimited checklists
- Smart suggestions
- Cloud sync
- Custom voice alerts
- Streak rewards

## API Endpoints
- Auth: POST /api/auth/register, /login, /guest, /test-premium
- Checklists: GET/POST/PUT/DELETE /api/checklists
- Stats: GET /api/stats
- Exits: GET/POST /api/exits
- Locations: GET/POST/DELETE /api/locations
