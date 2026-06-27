# Coincision — Setup Notes

## Opening the project
Open `Coincision.xcodeproj` in Xcode 15+. Select the **Coincision** scheme and the **iPhone 15 Pro** simulator.

## Before you build

### 1. Add the coin asset
Drop `coin_floating.png` (and @2x / @3x variants if you have them) into:
```
Coincision/Assets.xcassets/coin_floating.imageset/
```
The imageset catalog entry is already wired up. The image must be a PNG with transparency so the coin floats cleanly over the dark background.

### 2. Sign the app
In the **Signing & Capabilities** tab, set your Team. Bundle ID is `com.coincision.app` — change it if needed.

### 3. SwiftData
SwiftData is enabled automatically via `@Model` on `FlipEntry`. No additional configuration required.

## File map
```
Coincision/
├── CoincisionApp.swift          App entry + root splash→home transition
├── Constants/
│   ├── CoinConstants.swift      Every magic number in the app
│   ├── AnimationTokens.swift    Every animation curve and duration
│   └── ColorPalette.swift       Color palette + hex initialiser
├── Models/
│   └── FlipEntry.swift          SwiftData model for flip history
├── Managers/
│   ├── HapticsManager.swift     Haptic patterns (coinTouch / coinLand / coinSettle)
│   └── AudioManager.swift       Phase 2 audio stubs
├── Components/
│   ├── DustParticle.swift       Ambient particle data + view
│   └── WaitingCoin.swift        ★ The soul of the app — fully self-contained
└── Views/
    ├── SplashScreen.swift
    ├── HomeScreen.swift
    ├── FlipScreen.swift
    └── JournalScreen.swift
```

## Typography notes
- `New York` (serif) — ships with iOS, no import needed. Used for result reveals and taglines.
- `SF Pro Display` — system font, referenced via `.system(size:weight:design:)`.
- All weights are `.light` (300) or `.regular` (400) per the brand spec.

## Phase 2: Audio
`AudioManager` has four stubbed methods (`playCoinFlick`, `playAirSpin`, `playMetalLanding`, `playTing`). When custom audio files are ready, add them to the bundle and implement playback inside those methods using `AVAudioPlayer` or `AVAudioEngine`.
