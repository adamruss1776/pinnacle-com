import SwiftUI

// Coincision color palette. Never use pure white or pure black.
extension Color {
    static let coinBackground  = Color(hex: "#0D0D14")
    static let coinSurface     = Color(hex: "#13131C")
    static let coinGold        = Color(hex: "#D4AF5A")
    static let coinGoldMuted   = Color(hex: "#D4AF5A").opacity(0.5)
    static let coinTextPrimary = Color.white.opacity(0.88)
    static let coinTextSecondary = Color.white.opacity(0.42)

    // Hex initialiser (no third-party dep needed)
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int & 0xFF)          / 255
        self.init(red: r, green: g, blue: b)
    }
}
