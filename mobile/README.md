# MindEase Mobile App

React Native mobile application for MindEase - AI-powered screenshot management with voice memos.

## Features

### 📸 Screenshot Capture
- **Camera Integration** - Capture screenshots directly from your device camera
- **Gallery Import** - Upload existing images from your photo library
- **AI Processing** - Automatic image analysis, OCR, and tagging
- **Smart Collections** - Auto-organized based on content

### 🎤 Voice Memos
- **Native Recording** - High-quality audio recording (up to 60 seconds)
- **Pause & Resume** - Full recording control
- **Playback Preview** - Review before uploading
- **AI Transcription** - Automatic speech-to-text using Whisper
- **Searchable** - Find screenshots by voice memo content

### 🔍 Search
- **AI Semantic Search** - Understand meaning, not just keywords
- **Keyword Search** - Traditional text matching
- **Hybrid Search** - Best of both worlds
- **Visual Results** - See similarity scores and highlights

### 📁 Collections
- **Auto Collections** - Created based on AI analysis
- **Smart Tagging** - Work, Code, Design, Meetings, etc.
- **Quick Access** - Browse by category

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe code
- **React Navigation** - Navigation library
- **TanStack Query** - Data fetching and caching
- **Expo Camera** - Camera access
- **Expo AV** - Audio recording and playback
- **Axios** - HTTP client

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android) or Xcode (for iOS)
- Physical device or emulator

## Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

The app connects to your backend API. Update the API URL in `src/api/client.ts`:

```typescript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:8000';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:8000';

// For Physical Device (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.X:8000';
```

Or set an environment variable in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP:8000"
    }
  }
}
```

### 3. Start Development Server

```bash
npm start
```

This will start the Expo development server and open Expo Dev Tools in your browser.

### 4. Run on Device/Emulator

**Android:**
```bash
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

**Or scan QR code with:**
- **Android**: Expo Go app
- **iOS**: Camera app (iOS 11+) or Expo Go app

## Development

### Project Structure

```
mobile/
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies
├── src/
│   ├── api/
│   │   └── client.ts        # API client (adapted from web)
│   ├── components/
│   │   ├── AudioRecorder.tsx    # Voice recording component
│   │   └── AudioList.tsx        # Audio playback list
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Navigation setup
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Screenshot grid
│   │   ├── CameraScreen.tsx     # Camera capture
│   │   ├── SearchScreen.tsx     # Search interface
│   │   ├── CollectionsScreen.tsx # Collections view
│   │   └── ScreenshotDetailScreen.tsx # Detail view
│   └── types/
│       └── index.ts         # TypeScript types
└── assets/                  # Images, icons, splash
```

### Key Features Implementation

#### Camera Capture
Uses `expo-camera` for native camera access:
- Back/front camera toggle
- Capture with preview
- Gallery picker integration
- Direct upload to backend

#### Voice Recording
Uses `expo-av` for native audio:
- Request microphone permissions
- High-quality recording (m4a format)
- Real-time duration display
- Pause/resume functionality
- Playback before upload

#### Navigation
Bottom tabs for main sections:
- Home (screenshot grid)
- Camera (capture)
- Search (AI search)
- Collections (organized view)

Stack navigation for details:
- Screenshot detail modal
- Full-screen viewing

## Permissions

The app requires the following permissions:

### iOS (Info.plist)
- `NSCameraUsageDescription` - Camera access for capturing screenshots
- `NSMicrophoneUsageDescription` - Microphone access for voice memos
- `NSPhotoLibraryUsageDescription` - Photo library access for uploads

### Android (AndroidManifest.xml)
- `android.permission.CAMERA`
- `android.permission.RECORD_AUDIO`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`

These are automatically configured in `app.json`.

## Building for Production

### Android APK

```bash
expo build:android
```

Or with EAS Build:
```bash
eas build --platform android
```

### iOS IPA

```bash
expo build:ios
```

Or with EAS Build:
```bash
eas build --platform ios
```

## Publishing to App Stores

### Google Play Store

1. **Create App Bundle:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Configure `app.json`:**
   - Set unique `android.package` (e.g., `com.mindease.app`)
   - Add version code and version name
   - Configure adaptive icon

3. **Submit:**
   - Create Google Play Developer account
   - Upload AAB file
   - Fill in app details, screenshots, privacy policy
   - Submit for review

### Apple App Store

1. **Create IPA:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Configure `app.json`:**
   - Set unique `ios.bundleIdentifier`
   - Add version and build number
   - Configure app icon

3. **Submit:**
   - Create Apple Developer account
   - Upload via Transporter or Application Loader
   - Fill in App Store Connect details
   - Submit for review

## API Integration

The mobile app uses the same backend API as the web version:

- `POST /api/v1/screenshots/upload` - Upload screenshot
- `GET /api/v1/screenshots` - Get all screenshots
- `GET /api/v1/screenshots/:id` - Get screenshot details
- `POST /api/v1/screenshots/:id/favorite` - Toggle favorite
- `DELETE /api/v1/screenshots/:id` - Delete screenshot
- `POST /api/v1/audio/upload` - Upload voice memo
- `GET /api/v1/audio?screenshot_id=X` - Get audio for screenshot
- `DELETE /api/v1/audio/:id` - Delete audio
- `POST /api/v1/search` - Search screenshots
- `GET /api/v1/collections` - Get collections

## Environment Variables

Create `.env` file (not committed to git):

```bash
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:8000
```

Access in code:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL;
```

## Troubleshooting

### Camera Permission Denied
- Go to device Settings → Apps → MindEase → Permissions
- Enable Camera and Microphone

### Cannot Connect to Backend
- Ensure backend is running
- Check firewall settings
- For Android emulator, use `10.0.2.2` instead of `localhost`
- For physical device, use your computer's local IP address
- Ensure device and computer are on same network

### Build Errors
```bash
# Clear cache
expo start -c

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear watchman (macOS)
watchman watch-del-all
```

### Audio Recording Not Working
- Check microphone permissions
- Close other apps using microphone
- Restart the app
- Check device volume settings

## Testing

### Run Tests
```bash
npm test
```

### Test on Different Devices
- Android emulator (various screen sizes)
- iOS simulator (iPhone, iPad)
- Physical Android device
- Physical iOS device

## Performance Optimization

- **Image Compression** - Compress before upload (quality: 0.8)
- **Query Caching** - TanStack Query with 5s stale time
- **Lazy Loading** - FlatList with virtualization
- **Optimistic Updates** - Immediate UI updates

## Security

- **API Authentication** - Ready for token-based auth
- **Secure Storage** - Use `expo-secure-store` for tokens
- **HTTPS** - Use HTTPS in production
- **Input Validation** - Client and server-side validation

## Future Enhancements

- [ ] Push notifications for processing complete
- [ ] Offline mode with local storage
- [ ] Share extension (capture from other apps)
- [ ] Widget for quick capture
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Cloud sync
- [ ] Collaborative collections

## Contributing

1. Create feature branch
2. Make changes
3. Test on both iOS and Android
4. Submit pull request

## License

MIT License - see LICENSE file

## Support

For issues or questions:
- Create GitHub issue
- Check documentation
- Review troubleshooting guide

---

**Built with ❤️ using React Native and Expo**
