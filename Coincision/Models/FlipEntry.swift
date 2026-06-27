import Foundation
import SwiftData

// Persisted record of a single coin flip decision.
@Model
final class FlipEntry {
    var id: UUID
    var date: Date
    var headsOption: String
    var tailsOption: String
    var result: FlipResult

    init(headsOption: String, tailsOption: String, result: FlipResult) {
        self.id = UUID()
        self.date = Date()
        self.headsOption = headsOption
        self.tailsOption = tailsOption
        self.result = result
    }
}

enum FlipResult: String, Codable, CaseIterable {
    case heads
    case tails

    var label: String {
        switch self {
        case .heads: return "HEADS"
        case .tails: return "TAILS"
        }
    }

    static func random() -> FlipResult {
        Bool.random() ? .heads : .tails
    }
}
