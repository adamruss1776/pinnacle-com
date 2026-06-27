import SwiftUI
import SwiftData

// The moment of revelation. The coin decides nothing — it reveals what you already feel.
struct FlipScreen: View {

    let headsOption: String
    let tailsOption: String
    var onDismiss: () -> Void

    @Environment(\.modelContext) private var modelContext

    // MARK: - Animation state
    @State private var coinScale: CGFloat = 1.0
    @State private var coinOffsetY: CGFloat = 0
    @State private var coinRotationY: Double = 0
    @State private var phase: FlipPhase = .launching

    // MARK: - Result state
    @State private var result: FlipResult = .random()
    @State private var resultOpacity: Double = 0
    @State private var resultScale: CGFloat = 0.85

    enum FlipPhase {
        case launching, spinning, landing, revealed
    }

    private var resultOption: String {
        result == .heads ? headsOption : tailsOption
    }

    var body: some View {
        ZStack {
            Color.coinBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Coin in flight
                Image("coin_floating")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: CoinConstants.coinSize, height: CoinConstants.coinSize)
                    .scaleEffect(coinScale)
                    .offset(y: coinOffsetY)
                    .rotation3DEffect(.degrees(coinRotationY), axis: (x: 0, y: 1, z: 0))
                    .shadow(color: Color.coinGold.opacity(0.4), radius: 28, x: 0, y: 12)
                    .drawingGroup()

                Spacer()

                // Result — fades in after landing
                if phase == .revealed {
                    resultView
                        .opacity(resultOpacity)
                        .scaleEffect(resultScale)
                        .transition(.opacity)
                }

                Spacer()
                    .frame(height: 60)
            }

            // Tap anywhere to dismiss once result is shown
            if phase == .revealed {
                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture { onDismiss() }
                    .ignoresSafeArea()
                    .accessibilityLabel("Tap to return")
                    .accessibilityHint("Double-tap to return to home screen")
            }
        }
        .onAppear { startFlipSequence() }
    }

    // MARK: - Result view

    private var resultView: some View {
        VStack(spacing: 12) {
            // The chosen option — New York serif, light weight, large
            Text(resultOption)
                .font(.custom("NewYork", size: 34).weight(.light))
                .foregroundColor(.coinTextPrimary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
                .accessibilityLabel("Result: \(resultOption)")

            // Heads / Tails label — small gold uppercase
            Text(result.label)
                .font(.system(size: 10, weight: .regular))
                .tracking(2.5)
                .foregroundColor(.coinGold)

            Text("Tap anywhere to continue")
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.coinTextSecondary)
                .padding(.top, 24)
        }
    }

    // MARK: - Flip sequence

    private func startFlipSequence() {
        result = .random()

        // Phase 1: coin rises
        withAnimation(AnimationTokens.flipLaunch) {
            coinOffsetY = -60
            coinScale = 1.12
        }

        // Phase 2: rapid spin (Y-axis flip)
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            phase = .spinning
            AudioManager.shared.playCoinFlick()
            AudioManager.shared.playAirSpin()
            withAnimation(.linear(duration: CoinConstants.flipDuration)) {
                coinRotationY = 360 * CoinConstants.flipRotations
            }
            withAnimation(.easeIn(duration: CoinConstants.flipDuration * 0.4)) {
                coinOffsetY = -120
            }
            // Arc back down
            DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.flipDuration * 0.45) {
                withAnimation(.easeOut(duration: CoinConstants.flipDuration * 0.55)) {
                    coinOffsetY = 0
                }
            }
        }

        // Phase 3: land with spring bounce
        let landTime = 0.25 + CoinConstants.flipDuration
        DispatchQueue.main.asyncAfter(deadline: .now() + landTime) {
            phase = .landing
            AudioManager.shared.playMetalLanding()
            HapticsManager.shared.coinLand()
            withAnimation(AnimationTokens.flipLand) {
                coinScale = 1.0
                coinOffsetY = 0
            }
            // Settle haptic after brief pause
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                HapticsManager.shared.coinSettle()
                AudioManager.shared.playTing()
            }
        }

        // Phase 4: reveal result
        DispatchQueue.main.asyncAfter(deadline: .now() + landTime + 0.35) {
            phase = .revealed
            persistEntry()
            withAnimation(AnimationTokens.resultReveal) {
                resultOpacity = 1
                resultScale = 1.0
            }
        }
    }

    // MARK: - Persistence

    private func persistEntry() {
        let entry = FlipEntry(
            headsOption: headsOption,
            tailsOption: tailsOption,
            result: result
        )
        modelContext.insert(entry)
        try? modelContext.save()
    }
}

#Preview {
    FlipScreen(headsOption: "Take the job", tailsOption: "Stay", onDismiss: {})
        .modelContainer(for: FlipEntry.self, inMemory: true)
}
