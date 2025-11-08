# Android Native App Sync Guide

## Understanding the Architecture

Your app uses a **hybrid architecture**:
- **Web content**: Loaded from `https://task-five-sable.vercel.app`
- **Native shell**: Android APK with native configurations

## What Requires Native Rebuild vs Web Deploy

### Web Deploy Only (Automatic via Vercel)
These changes are reflected immediately after deploying to Vercel:
- ✅ `src/components/StatusBarManager.tsx`
- ✅ `src/components/Navbar.tsx`
- ✅ `src/globals.css`
- ✅ Any other React/TypeScript/CSS files

### Native Rebuild Required
These changes require rebuilding and reinstalling the Android APK:
- ⚠️ `android/app/src/main/res/values/styles.xml`
- ⚠️ `android/app/src/main/res/values-night/styles.xml`
- ⚠️ `android/app/src/main/AndroidManifest.xml`
- ⚠️ `capacitor.config.ts` (needs sync + rebuild)

## Steps to Sync and Rebuild Android App

### Step 1: Build Web Content
```bash
npm run build
```

### Step 2: Sync Capacitor Configuration
```bash
npx cap sync android
```
This copies:
- `capacitor.config.ts` → `android/app/src/main/assets/capacitor.config.json`
- Web build files → Android assets
- Updates native dependencies

### Step 3: Rebuild Android App

**Option A: Using Capacitor CLI**
```bash
npx cap run android
```

**Option B: Using Android Studio**
1. Open the `android` folder in Android Studio
2. Click "Sync Project with Gradle Files"
3. Click "Build" → "Rebuild Project"
4. Click "Run" → "Run 'app'"

### Step 4: Install on Device
The new APK will be automatically installed on your connected device or emulator.

## Current Status Bar Configuration

### Native Android Styles
- **Light Mode**: `windowLightStatusBar = true` (dark icons on white navbar)
- **Dark Mode**: `windowLightStatusBar = false` (light icons on dark navbar)
- **Status Bar Color**: Transparent (allows navbar to show through)

### Capacitor Config
- **overlaysWebView**: `true` (status bar is transparent, content draws behind it)
- **style**: `DEFAULT` (allows dynamic control via StatusBarManager)

### Web Implementation
- **StatusBarManager**: Dynamically sets icon color based on theme
- **Navbar**: Has top padding (`pt-[env(safe-area-inset-top)]`) to account for status bar

## Troubleshooting

### Status Bar Icons Still Invisible?
1. Verify you've rebuilt the Android app (not just deployed web content)
2. Check that styles.xml files are correctly updated
3. Ensure `npx cap sync android` was run after config changes
4. Clear app data and reinstall: `adb uninstall com.abumiral.workflow && npx cap run android`

### Changes Not Reflecting?
- **Web changes**: Deploy to Vercel, then refresh app
- **Native changes**: Must rebuild APK and reinstall

### Testing Locally
To test with local web content instead of Vercel:
1. Comment out the `server.url` in `capacitor.config.ts`
2. Run `npm run build`
3. Run `npx cap sync android`
4. Run `npx cap run android`

## Quick Reference Commands

```bash
# Full rebuild workflow
npm run build
npx cap sync android
npx cap run android

# Just sync config changes
npx cap sync android

# Open in Android Studio
npx cap open android

# Check Capacitor status
npx cap doctor