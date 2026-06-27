import SwiftUI

// A single ambient gold dust particle that drifts near the coin.
struct DustParticleData: Identifiable {
    let id = UUID()
    let size: CGFloat
    let xOffset: CGFloat       // resting horizontal offset from coin center
    let yOffset: CGFloat       // resting vertical offset from coin center
    let driftX: CGFloat        // drift amplitude in X
    let driftY: CGFloat        // drift amplitude in Y
    let driftDuration: Double  // seconds per full cycle
    let baseOpacity: Double    // 0–1
    let phase: Double          // animation phase offset (0–1) so particles don't sync

    static func random(in bounds: CGSize) -> DustParticleData {
        let spread: CGFloat = 90
        return DustParticleData(
            size:          CGFloat.random(in: CoinConstants.particleSizeMin...CoinConstants.particleSizeMax),
            xOffset:       CGFloat.random(in: -spread...spread),
            yOffset:       CGFloat.random(in: -spread...spread),
            driftX:        CGFloat.random(in: -18...18),
            driftY:        CGFloat.random(in: -14...14),
            driftDuration: Double.random(in: CoinConstants.particleDriftMin...CoinConstants.particleDriftMax),
            baseOpacity:   Double.random(in: 0.12...0.38),
            phase:         Double.random(in: 0...1)
        )
    }
}

// Renders and animates a single dust particle.
struct DustParticleView: View {
    let particle: DustParticleData
    let brightened: Bool   // tap-response brightening

    @State private var drifting = false

    var body: some View {
        Circle()
            .fill(Color.coinGold)
            .frame(width: particle.size, height: particle.size)
            .offset(
                x: particle.xOffset + (drifting ? particle.driftX : -particle.driftX),
                y: particle.yOffset + (drifting ? particle.driftY : -particle.driftY)
            )
            .opacity(brightened
                ? min(particle.baseOpacity * 2.2, 0.85)
                : particle.baseOpacity)
            .animation(
                AnimationTokens.particleDrift(particle.driftDuration)
                    .delay(particle.phase * particle.driftDuration),
                value: drifting
            )
            .onAppear {
                // Stagger start so particles don't all move together
                DispatchQueue.main.asyncAfter(deadline: .now() + particle.phase * particle.driftDuration) {
                    drifting = true
                }
            }
    }
}
