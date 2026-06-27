import SwiftUI

// Single source of truth for every animation curve and duration.
enum AnimationTokens {

    // MARK: - Idle / ambient
    static let coinFloat    = Animation.easeInOut(duration: CoinConstants.floatDuration).repeatForever(autoreverses: true)
    static let coinTilt     = Animation.easeInOut(duration: CoinConstants.tiltDuration).repeatForever(autoreverses: true)
    static let glowPulse    = Animation.easeInOut(duration: CoinConstants.floatDuration).repeatForever(autoreverses: true)
    static let particleDrift: (Double) -> Animation = { duration in
        Animation.easeInOut(duration: duration).repeatForever(autoreverses: true)
    }

    // MARK: - Touch response
    static let tapTilt      = Animation.spring(response: 0.25, dampingFraction: 0.6)
    static let tapReturn    = Animation.spring(response: CoinConstants.tapReturnDuration, dampingFraction: 0.75)

    // MARK: - Imperfection
    static let imperfectionWobble = Animation.spring(response: 0.3, dampingFraction: 0.4)
    static let imperfectionSettle = Animation.spring(response: 0.5, dampingFraction: 0.8)

    // MARK: - Flip
    static let flipLaunch   = Animation.easeIn(duration: 0.3)
    static let flipSpin     = Animation.linear(duration: CoinConstants.flipDuration)
    static let flipLand     = Animation.spring(response: 0.4, dampingFraction: 0.55)
    static let resultReveal = Animation.easeOut(duration: 0.5)

    // MARK: - Reduce Motion fallback
    static let opacityPulse = Animation.easeInOut(duration: 2.5).repeatForever(autoreverses: true)

    // MARK: - Splash transitions
    static let splashFadeIn = Animation.easeInOut(duration: CoinConstants.splashFadeDuration)
}
