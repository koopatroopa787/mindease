# MindEase Mobile App - Complete Setup Guide

This guide will help you set up and run the MindEase mobile application on Android and iOS devices.

## 📱 What's Included

The MindEase mobile app is a full-featured React Native application with:

✅ **Camera Screenshot Capture** - Take photos directly from your device
✅ **Gallery Import** - Upload existing images
✅ **Voice Memos** - Record audio notes (up to 60 seconds)
✅ **AI Processing** - Automatic image analysis and transcription
✅ **Semantic Search** - Find screenshots by meaning, not just keywords
✅ **Smart Collections** - Auto-organized by content type
✅ **Offline-Ready** - Works with local caching

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites

Make sure you have installed:
- **Node.js 18+** ([Download](https://nodejs.org))
- **Git** ([Download](https://git-scm.com))
- **Expo Go app** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Install Dependencies

```bash
cd mobile
npm install
```

### 3. Configure Backend Connection

**Option A: Using .env file (Recommended)**
```bash
cp .env.example .env
```

Edit `.env` and set your backend URL:
```bash
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# For iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:8000

# For Physical Device (find your computer's IP with 'ipconfig' or 'ifconfig')
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

**Option B: Modify source code**

Edit `mobile/src/api/client.ts`:
```typescript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://YOUR_IP:8000';
```

### 4. Start the App

```bash
npm start
```

This opens the Expo DevTools. Now you can:
- **Scan QR code** with Expo Go app (easiest)
- **Press 'a'** to run on Android emulator
- **Press 'i'** to run on iOS simulator (macOS only)

### 5. Test the App

1. **Grant Permissions** - Allow camera and microphone access
2. **Tap Camera tab** - Capture a test screenshot
3. **Upload** - Wait for AI processing (~10 seconds)
4. **View Details** - Tap the screenshot to see AI analysis
5. **Add Voice Memo** - Record a voice note about the screenshot
6. **Search** - Try searching for your screenshot

## 📋 Detailed Setup

### For Android Development

#### Using Android Emulator

1. **Install Android Studio** ([Download](https://developer.android.com/studio))

2. **Install Android SDK and Emulator:**
   - Open Android Studio
   - Tools → SDK Manager
   - Install SDK Platform 33 (Android 13)
   - Install SDK Tools (Android SDK Platform-Tools, Build-Tools)

3. **Create Virtual Device:**
   - Tools → AVD Manager
   - Create Virtual Device
   - Choose Pixel 5 (or any device)
   - System Image: Android 13 (API 33)
   - Finish

4. **Start Emulator:**
   - AVD Manager → Start
   - Wait for emulator to boot

5. **Run App:**
   ```bash
   cd mobile
   npm run android
   ```

#### Using Physical Android Device

1. **Enable Developer Options:**
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. **Connect Device:**
   - Connect via USB
   - Allow USB debugging popup
   - Verify: `adb devices` (should list your device)

3. **Connect to Backend:**
   - Make sure your phone and computer are on the **same WiFi network**
   - Find your computer's IP:
     - Windows: `ipconfig` (look for IPv4 Address)
     - macOS/Linux: `ifconfig | grep inet` or `ip addr`
   - Update `.env` with your IP: `EXPO_PUBLIC_API_URL=http://192.168.1.X:8000`

4. **Run App:**
   ```bash
   npm run android
   ```

### For iOS Development (macOS only)

#### Using iOS Simulator

1. **Install Xcode** from App Store (this takes a while!)

2. **Install Command Line Tools:**
   ```bash
   xcode-select --install
   ```

3. **Install CocoaPods:**
   ```bash
   sudo gem install cocoapods
   ```

4. **Run App:**
   ```bash
   cd mobile
   npm run ios
   ```

#### Using Physical iOS Device

1. **Install Expo Go** from App Store

2. **Connect to Same WiFi** as your computer

3. **Start Dev Server:**
   ```bash
   npm start
   ```

4. **Scan QR Code** with Camera app or Expo Go

**Note:** For standalone iOS builds (not Expo Go), you need an Apple Developer account ($99/year).

## 🎯 Backend Setup

The mobile app requires the backend API to be running.

### Start Backend

```bash
cd backend
docker-compose up -d
```

Verify it's running:
```bash
curl http://localhost:8000/api/v1/screenshots
```

### Configure Backend for Mobile Access

For **physical devices** to connect, the backend must be accessible on your local network:

**Edit `backend/docker-compose.yml`:**
```yaml
services:
  web:
    ports:
      - "0.0.0.0:8000:8000"  # Bind to all interfaces
```

Restart:
```bash
docker-compose restart web
```

**Allow firewall access** (if needed):
```bash
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/docker

# Windows
# Windows Defender Firewall → Allow an app → Docker Desktop

# Linux
sudo ufw allow 8000/tcp
```

Test from your phone's browser:
```
http://YOUR_COMPUTER_IP:8000/docs
```

You should see the API documentation.

## 🔍 Feature Guide

### Camera Capture

1. **Open Camera Tab** - Bottom navigation
2. **Allow Permissions** - Grant camera and photo library access
3. **Take Photo** - Tap the blue capture button
4. **Review** - Preview before uploading
5. **Upload** - Tap "Upload" button
6. **Processing** - Wait ~10 seconds for AI analysis

**Tips:**
- Use good lighting for better OCR results
- Capture text-heavy images for better search
- Screenshots process faster than photos

### Voice Memos

1. **Open Screenshot** - Tap any screenshot card
2. **Scroll to Voice Memos** - Bottom of detail view
3. **Add Voice Memo** - Tap "+ Add Voice Memo"
4. **Record** - Tap red microphone button
5. **Pause/Resume** - Control your recording
6. **Stop** - Tap stop when done
7. **Review** - Play back before uploading
8. **Upload** - Automatic after recording

**Tips:**
- Speak clearly for better transcription
- Use in quiet environment
- 60-second limit is usually enough
- Transcription takes ~5-10 seconds

### Search

1. **Search Tab** - Bottom navigation
2. **Enter Query** - Type what you're looking for
3. **Choose Search Type:**
   - **AI Search** - Understands meaning and context
   - **Keyword** - Exact text matching
   - **Both** - Best results (recommended)
4. **View Results** - Sorted by relevance

**Example Searches:**
- "error message" → Finds screenshots with errors
- "meeting notes" → Finds notes from meetings
- "code snippet" → Finds code screenshots
- "receipt" → Finds receipt images

### Collections

1. **Collections Tab** - Bottom navigation
2. **Browse** - Auto-created based on content
3. **Tap Collection** - View all screenshots in that category

**Auto Collections:**
- **Work** - Business, office-related
- **Code** - Programming, development
- **Design** - UI, UX, mockups
- **Meeting** - Zoom, Teams screenshots
- **Chat** - Messages, conversations
- **Social** - Twitter, Facebook, etc.

## 🛠️ Development

### Project Structure
```
mobile/
├── App.tsx                      # Root app component
├── app.json                     # Expo configuration
├── src/
│   ├── api/client.ts            # Backend API integration
│   ├── components/
│   │   ├── AudioRecorder.tsx    # Voice recording
│   │   └── AudioList.tsx        # Audio playback
│   ├── navigation/
│   │   └── AppNavigator.tsx     # Screen navigation
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main screenshot grid
│   │   ├── CameraScreen.tsx     # Camera capture
│   │   ├── SearchScreen.tsx     # Search interface
│   │   ├── CollectionsScreen.tsx# Collections view
│   │   └── ScreenshotDetailScreen.tsx # Detail view
│   └── types/index.ts           # TypeScript types
```

### Making Changes

1. **Edit files** in `src/` directory
2. **See changes live** - App reloads automatically
3. **Shake device** - Open developer menu
4. **Press 'r'** in terminal - Reload manually

### Debugging

**View Logs:**
```bash
# In Expo DevTools terminal
# All console.log() statements appear here
```

**React DevTools:**
```bash
npm install -g react-devtools
react-devtools
```

**Network Debugging:**
- Use React Native Debugger
- Or Flipper for advanced debugging

## 📦 Building for Production

### Android APK (for testing)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

Download APK and install on any Android device.

### Production Builds

**Android (.aab for Play Store):**
```bash
eas build --platform android --profile production
```

**iOS (.ipa for App Store):**
```bash
eas build --platform ios --profile production
```

See `mobile/README.md` for full publishing guide.

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Check:**
1. Backend is running: `curl http://localhost:8000`
2. `.env` has correct IP address
3. Firewall allows port 8000
4. Device and computer on same WiFi
5. For Android emulator: use `10.0.2.2` not `localhost`

**Fix:**
```bash
# Find your IP
ipconfig  # Windows
ifconfig  # macOS/Linux

# Update .env
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000

# Restart app
npm start
```

### "Camera permission denied"

**Fix:**
1. Go to device Settings
2. Apps → MindEase (or Expo Go)
3. Permissions → Camera → Allow
4. Same for Microphone
5. Restart app

### "Build failed" or dependency errors

```bash
# Clear cache and reinstall
rm -rf node_modules
npm cache clean --force
npm install

# Clear Expo cache
expo start -c

# Reset Metro bundler
npm start -- --reset-cache
```

### "Module not found" errors

```bash
# Make sure you're in the mobile directory
cd mobile

# Install dependencies
npm install

# Try clearing watchman (macOS)
watchman watch-del-all
```

### Voice recording not working

**Check:**
1. Microphone permissions granted
2. No other app using microphone (close Zoom, etc.)
3. Device volume not muted
4. Try on different device/simulator

### App crashes on startup

**Check:**
1. Node version: `node --version` (should be 18+)
2. Update Expo: `expo upgrade`
3. Check console errors
4. Try on different simulator/device

## 💡 Tips & Best Practices

### Performance
- Keep images under 5MB
- Use 0.8 quality for uploads
- Clear old screenshots periodically

### Battery Life
- Close app when not in use
- Voice memos use less battery than camera

### Storage
- Voice memos: ~1MB per minute
- Screenshots: 200KB-2MB compressed
- Cache cleared automatically

### Privacy
- All data stored on your backend
- No third-party tracking
- Delete anytime

## 📞 Support

**Common Issues:**
- Check this guide first
- See `mobile/README.md`
- Check GitHub issues

**Need Help?**
- Create GitHub issue with:
  - Device model and OS version
  - Error message or screenshot
  - Steps to reproduce
  - Console logs

## 🎉 Next Steps

1. ✅ **Test the App** - Try all features
2. ✅ **Customize** - Adjust colors, themes
3. ✅ **Deploy Backend** - Production server
4. ✅ **Publish App** - Play Store / App Store
5. ✅ **Add Features** - See roadmap in README

---

**Enjoy MindEase! 🚀**

Built with React Native, Expo, and ❤️
