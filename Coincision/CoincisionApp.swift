import SwiftUI
import SwiftData

@main
struct CoincisionApp: App {

    var body: some Scene {
        WindowGroup {
            RootView()
        }
        .modelContainer(for: FlipEntry.self)
    }
}

// Manages the splash → home transition at the root level.
private struct RootView: View {

    @State private var splashDone = false

    var body: some View {
        if splashDone {
            HomeScreen()
                .transition(.opacity)
        } else {
            SplashScreen(onComplete: {
                withAnimation(.easeInOut(duration: 0.6)) {
                    splashDone = true
                }
            })
            .transition(.opacity)
        }
    }
}
