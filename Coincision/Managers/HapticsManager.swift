import UIKit
import CoreHaptics

// Centralised haptic feedback. Always guard with availability checks.
final class HapticsManager {

    static let shared = HapticsManager()
    private var engine: CHHapticEngine?

    private init() {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else { return }
        engine = try? CHHapticEngine()
        try? engine?.start()
        engine?.resetHandler = { [weak self] in try? self?.engine?.start() }
        engine?.stoppedHandler = { _ in }
    }

    // Light touch when user taps the waiting coin
    func coinTouch() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }

    // Success notification on coin landing after flip
    func coinLand() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
    }

    // Two light impacts 80ms apart — coin settling into place
    func coinSettle() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.settleHapticGap) {
            generator.impactOccurred()
        }
    }
}
