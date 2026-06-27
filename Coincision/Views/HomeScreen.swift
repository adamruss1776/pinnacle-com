import SwiftUI
import SwiftData

// The resting state of Coincision. The coin owns the screen; the inputs are guests.
struct HomeScreen: View {

    @State private var headsText: String = ""
    @State private var tailsText: String = ""
    @State private var headsFieldFocused: Bool = false
    @State private var tailsFieldFocused: Bool = false
    @State private var coinTouched: Bool = false
    @State private var showFlip: Bool = false
    @State private var showJournal: Bool = false

    // Validation: both fields must have content to flip
    private var canFlip: Bool {
        !headsText.trimmingCharacters(in: .whitespaces).isEmpty &&
        !tailsText.trimmingCharacters(in: .whitespaces).isEmpty
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.coinBackground.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Wordmark
                    wordmark
                        .padding(.top, 20)

                    Spacer()

                    // The hero — everything else is arranged around it
                    WaitingCoin(isTouched: coinTouched)
                        .onTapGesture { handleCoinTap() }

                    Spacer()

                    // Decision inputs + CTA
                    inputSection
                        .padding(.horizontal, 32)
                        .padding(.bottom, 48)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    journalButton
                }
            }
            .sheet(isPresented: $showFlip) {
                FlipScreen(
                    headsOption: headsText,
                    tailsOption: tailsText,
                    onDismiss: { showFlip = false }
                )
            }
            .sheet(isPresented: $showJournal) {
                JournalScreen()
            }
        }
    }

    // MARK: - Sub-views

    private var wordmark: some View {
        Text("COINCISION")
            .font(.system(size: 11, weight: .regular, design: .default))
            .tracking(2.2)
            .foregroundColor(Color.coinGold.opacity(0.5))
            .accessibilityLabel("Coincision")
    }

    private var journalButton: some View {
        Button {
            showJournal = true
        } label: {
            Image(systemName: "book.pages")
                .font(.system(size: 16, weight: .light))
                .foregroundColor(.coinTextSecondary)
        }
        .accessibilityLabel("Open journal")
    }

    private var inputSection: some View {
        VStack(spacing: 24) {
            // Heads field
            GhostInputField(
                placeholder: "Heads",
                text: $headsText,
                isFocused: $headsFieldFocused
            )
            .accessibilityLabel("Heads option")

            // Tails field
            GhostInputField(
                placeholder: "Tails",
                text: $tailsText,
                isFocused: $tailsFieldFocused
            )
            .accessibilityLabel("Tails option")

            // CTA
            Button {
                guard canFlip else { return }
                showFlip = true
            } label: {
                Text("Flip the coin")
                    .font(.system(size: 15, weight: .light))
                    .foregroundColor(canFlip ? .coinGold : .coinGold.opacity(0.35))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(canFlip ? Color.coinGold : Color.coinGold.opacity(0.25), lineWidth: 0.5)
                    )
            }
            .disabled(!canFlip)
            .accessibilityLabel("Flip the coin")
            .accessibilityHint(canFlip ? "Double-tap to flip" : "Enter both options to flip")
        }
    }

    // MARK: - Interactions

    private func handleCoinTap() {
        HapticsManager.shared.coinTouch()
        coinTouched = true
        DispatchQueue.main.asyncAfter(deadline: .now() + CoinConstants.tapReturnDuration) {
            coinTouched = false
        }
    }
}

// MARK: - Ghost input field

// Invisible until focused: no border, then a thin gold underline on focus.
private struct GhostInputField: View {

    let placeholder: String
    @Binding var text: String
    @Binding var isFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            TextField("", text: $text, prompt: Text(placeholder)
                .foregroundColor(.coinTextSecondary)
                .font(.system(size: 16, weight: .light))
            )
            .font(.system(size: 16, weight: .light))
            .foregroundColor(.coinTextPrimary)
            .tint(.coinGold)
            .multilineTextAlignment(.center)
            .onTapGesture { isFocused = true }

            // Gold underline — visible only when focused
            Rectangle()
                .fill(isFocused ? Color.coinGold : Color.clear)
                .frame(height: 0.5)
                .animation(.easeInOut(duration: 0.2), value: isFocused)
        }
    }
}

#Preview {
    HomeScreen()
        .modelContainer(for: FlipEntry.self, inMemory: true)
}
