import SwiftUI

// All magic numbers live here. Never hardcode in views.
enum CoinConstants {

    // MARK: - Layout
    static let coinSize: CGFloat = 220
    static let coinShadowRadius: CGFloat = 40

    // MARK: - Float animation
    static let floatDistance: CGFloat = 5        // px up/down
    static let floatDuration: Double = 5.0       // seconds per cycle

    // MARK: - Tilt animation
    static let tiltDegrees: Double = 2.0         // ±° Z-axis during idle
    static let tiltDuration: Double = 7.0        // offset from float so they never sync
    static let imperfectionTiltDegrees: Double = 5.0

    // MARK: - Touch interaction
    static let tapTiltDegrees: Double = 8.0
    static let tapReturnDuration: Double = 0.6

    // MARK: - Flip animation
    static let flipDuration: Double = 1.1        // seconds
    static let flipRotations: Double = 6         // full rotations during flip

    // MARK: - Glow
    static let glowWidth: CGFloat = 100
    static let glowHeight: CGFloat = 18
    static let glowOpacityMin: Double = 0.18
    static let glowOpacityMax: Double = 0.38

    // MARK: - Dust particles
    static let particleCount: Int = 10
    static let particleSizeMin: CGFloat = 2
    static let particleSizeMax: CGFloat = 4
    static let particleDriftMin: Double = 4.0    // seconds per drift cycle
    static let particleDriftMax: Double = 9.0

    // MARK: - Imperfection trigger window
    static let imperfectionIntervalMin: Double = 60
    static let imperfectionIntervalMax: Double = 90

    // MARK: - Splash timing
    static let splashTaglineDelay: Double = 1.5
    static let splashQuestionDelay: Double = 3.0
    static let splashTransitionDelay: Double = 4.5
    static let splashFadeDuration: Double = 0.8

    // MARK: - Haptics
    static let settleHapticGap: Double = 0.08   // 80ms between two light impacts

    // MARK: - Colors (raw values — use Color extensions in practice)
    static let backgroundHex = "#0D0D14"
    static let surfaceHex    = "#13131C"
    static let goldHex       = "#D4AF5A"
}
