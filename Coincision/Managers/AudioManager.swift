import Foundation

// Phase 2 stub. Custom audio files will be wired in later.
// Do not use system sounds — these methods intentionally do nothing until assets arrive.
final class AudioManager {

    static let shared = AudioManager()
    private init() {}

    // Short flick sound as the coin leaves the thumb
    func playCoinFlick() {}

    // Spinning whir through the air
    func playAirSpin() {}

    // Heavy metallic thud on landing
    func playMetalLanding() {}

    // Bright resonant ring after the coin settles
    func playTing() {}
}
