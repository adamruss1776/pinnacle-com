import SwiftUI

// First thing the user sees. The coin is already there — it was never absent.
struct SplashScreen: View {

    var onComplete: () -> Void

    @State private var taglineOpacity: Double = 0
    @State private var questionOpacity: Double = 0

    var body: some View {
        ZStack {
            Color.coinBackground.ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                // The coin floats from the very first frame — no load animation
                WaitingCoin()

                Spacer()

                VStack(spacing: 20) {
                    Text("Every decision begins with uncertainty.")
                        .font(.custom("NewYork", size: 17).weight(.light))
                        .foregroundColor(.coinTextPrimary)
                        .multilineTextAlignment(.center)
                        .opacity(taglineOpacity)

                    Text("What decision is waiting for you today?")
                        .font(.custom("NewYork", size: 15).weight(.light))
                        .foregroundColor(.coinTextSecondary)
                        .multilineTextAlignment(.center)
                        .opacity(questionOpacity)
                }
                .padding(.horizontal, 40)

                Spacer()
                    .frame(height: 60)
            }
        }
        .onAppear { runSequence() }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Coincision splash screen")
    }

    private func runSequence() {
        // Tagline fades in at 1.5s
        DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.splashTaglineDelay) {
            withAnimation(AnimationTokens.splashFadeIn) {
                taglineOpacity = 1
            }
        }

        // Question fades in at 3s
        DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.splashQuestionDelay) {
            withAnimation(AnimationTokens.splashFadeIn) {
                questionOpacity = 1
            }
        }

        // Transition to HomeScreen at 4.5s
        DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.splashTransitionDelay) {
            onComplete()
        }
    }
}

#Preview {
    SplashScreen(onComplete: {})
}
