import SwiftUI

// The soul of Coincision. This coin is always present, always alive.
// It floats, breathes, and occasionally surprises the user so they forget it's a loop.
// Fully self-contained — no external dependencies.
struct WaitingCoin: View {

    // MARK: - External state
    /// When true, particles brighten and coin tilts — set by HomeScreen on tap
    var isTouched: Bool = false

    // MARK: - Float & tilt state
    @State private var floatOffset: CGFloat = 0
    @State private var tiltAngle: Double = 0
    @State private var glowOpacity: Double = CoinConstants.glowOpacityMin

    // MARK: - Touch-tilt state
    @State private var tapTiltX: Double = 0
    @State private var tapTiltY: Double = 0

    // MARK: - Imperfection state
    @State private var imperfectionTilt: Double = 0
    @State private var imperfectionTask: Task<Void, Never>? = nil

    // MARK: - Particles
    @State private var particles: [DustParticleData] = []

    // MARK: - Accessibility
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            // Glow beneath the coin
            if !reduceMotion {
                glowView
                    .offset(y: floatOffset + CoinConstants.coinSize * 0.48)
            }

            // Dust particles — rendered behind the coin
            if !reduceMotion {
                particleLayer
            }

            // The coin itself
            coinImage
                .offset(y: floatOffset)
                .rotation3DEffect(
                    .degrees(tapTiltX + imperfectionTilt),
                    axis: (x: 0, y: 1, z: 0)
                )
                .rotation3DEffect(
                    .degrees(tapTiltY),
                    axis: (x: 1, y: 0, z: 0)
                )
                .rotationEffect(.degrees(tiltAngle))
                // GPU composite the whole coin + glow layer
                .drawingGroup()
        }
        .frame(width: CoinConstants.coinSize + 100, height: CoinConstants.coinSize + 120)
        .contentShape(Rectangle())
        .accessibilityLabel("Waiting coin")
        .accessibilityHint("Tap to connect with the coin before flipping")
        .onAppear {
            particles = (0..<CoinConstants.particleCount).map { _ in
                DustParticleData.random(in: CGSize(width: CoinConstants.coinSize, height: CoinConstants.coinSize))
            }
            if !reduceMotion {
                startIdleAnimations()
                scheduleNextImperfection()
            }
        }
        .onDisappear {
            imperfectionTask?.cancel()
        }
        .onChange(of: isTouched) { _, touched in
            guard !reduceMotion else { return }
            if touched { performTapResponse() }
        }
    }

    // MARK: - Sub-views

    private var coinImage: some View {
        Group {
            if reduceMotion {
                // Accessibility: gentle opacity pulse only, no motion
                Image("coin_floating")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: CoinConstants.coinSize, height: CoinConstants.coinSize)
                    .opacity(glowOpacity + 0.62)   // reuse glow state as pulse driver
                    .onAppear {
                        withAnimation(AnimationTokens.opacityPulse) {
                            glowOpacity = CoinConstants.glowOpacityMax
                        }
                    }
            } else {
                Image("coin_floating")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: CoinConstants.coinSize, height: CoinConstants.coinSize)
                    .shadow(color: Color.coinGold.opacity(0.35), radius: 24, x: 0, y: 8)
            }
        }
    }

    private var glowView: some View {
        // Elliptical gold glow that pulses with the float cycle
        Ellipse()
            .fill(
                RadialGradient(
                    colors: [Color.coinGold.opacity(glowOpacity), .clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: CoinConstants.glowWidth * 0.5
                )
            )
            .frame(width: CoinConstants.glowWidth, height: CoinConstants.glowHeight)
            .blur(radius: 6)
    }

    private var particleLayer: some View {
        ZStack {
            ForEach(particles) { p in
                DustParticleView(particle: p, brightened: isTouched)
            }
        }
        .frame(width: CoinConstants.coinSize, height: CoinConstants.coinSize)
    }

    // MARK: - Animations

    private func startIdleAnimations() {
        // Float
        withAnimation(AnimationTokens.coinFloat) {
            floatOffset = -CoinConstants.floatDistance
        }

        // Tilt — offset duration ensures it never syncs with the float
        withAnimation(AnimationTokens.coinTilt) {
            tiltAngle = CoinConstants.tiltDegrees
        }

        // Glow pulse (tied to float cycle)
        withAnimation(AnimationTokens.glowPulse) {
            glowOpacity = CoinConstants.glowOpacityMax
        }
    }

    /// Brief tap response: tilt toward touch, particles brighten, return smoothly
    private func performTapResponse() {
        withAnimation(AnimationTokens.tapTilt) {
            tapTiltX = CoinConstants.tapTiltDegrees
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(AnimationTokens.tapReturn) {
                tapTiltX = 0
            }
        }
    }

    // MARK: - Imperfection engine

    /// Schedules a random imperfection between 60–90 seconds from now.
    /// After firing it reschedules itself, creating an infinite chain that never settles into a pattern.
    private func scheduleNextImperfection() {
        let delay = Double.random(
            in: CoinConstants.imperfectionIntervalMin...CoinConstants.imperfectionIntervalMax
        )
        imperfectionTask = Task {
            try? await Task.sleep(for: .seconds(delay))
            guard !Task.isCancelled else { return }
            await MainActor.run { fireImperfection() }
            scheduleNextImperfection()
        }
    }

    private func fireImperfection() {
        // Coin tilts to 5°, hesitates, then settles back
        withAnimation(AnimationTokens.imperfectionWobble) {
            imperfectionTilt = CoinConstants.imperfectionTiltDegrees
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.38) {
            withAnimation(AnimationTokens.imperfectionSettle) {
                imperfectionTilt = 0
            }
        }
    }
}

// MARK: - Preview

#Preview("WaitingCoin — Animated") {
    ZStack {
        Color.coinBackground.ignoresSafeArea()
        WaitingCoin()
    }
}

#Preview("WaitingCoin — Reduce Motion") {
    ZStack {
        Color.coinBackground.ignoresSafeArea()
        WaitingCoin()
    }
    .environment(\.accessibilityReduceMotion, true)
}
