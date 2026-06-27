import SwiftUI
import SwiftData

// Where decisions are remembered. Every flip leaves a trace.
struct JournalScreen: View {

    @Query(sort: \FlipEntry.date, order: .reverse)
    private var entries: [FlipEntry]

    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.coinBackground.ignoresSafeArea()

                if entries.isEmpty {
                    emptyState
                } else {
                    entryList
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("DECISIONS")
                        .font(.system(size: 11, weight: .regular))
                        .tracking(2.2)
                        .foregroundColor(.coinGold.opacity(0.5))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 14, weight: .light))
                        .foregroundColor(.coinTextSecondary)
                }
            }
            .toolbarBackground(Color.coinBackground, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    // MARK: - Sub-views

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("Your decisions will live here.")
                .font(.custom("NewYork", size: 17).weight(.light))
                .foregroundColor(.coinTextSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .accessibilityLabel("No decisions yet")
    }

    private var entryList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(entries) { entry in
                    JournalCard(entry: entry)
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
    }
}

// MARK: - Journal card

// Dark surface card with generous padding and swipe-to-delete (with confirmation).
private struct JournalCard: View {

    let entry: FlipEntry
    @Environment(\.modelContext) private var modelContext
    @State private var showDeleteConfirmation = false

    private var dateString: String {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f.string(from: entry.date)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Result line
            HStack {
                Text(entry.result == .heads ? entry.headsOption : entry.tailsOption)
                    .font(.custom("NewYork", size: 18).weight(.light))
                    .foregroundColor(.coinTextPrimary)

                Spacer()

                Text(entry.result.label)
                    .font(.system(size: 9, weight: .regular))
                    .tracking(2)
                    .foregroundColor(.coinGold)
            }

            // Options
            HStack(spacing: 4) {
                Text(entry.headsOption)
                    .foregroundColor(.coinTextSecondary)
                Text("·")
                    .foregroundColor(.coinTextSecondary)
                Text(entry.tailsOption)
                    .foregroundColor(.coinTextSecondary)
            }
            .font(.system(size: 12, weight: .light))

            // Timestamp
            Text(dateString)
                .font(.system(size: 11, weight: .light))
                .foregroundColor(.coinTextSecondary.opacity(0.6))
        }
        .padding(20)
        .background(Color.coinSurface)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.white.opacity(0.05), lineWidth: 0.5)
        )
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                showDeleteConfirmation = true
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .confirmationDialog(
            "Remove this decision?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                modelContext.delete(entry)
                try? modelContext.save()
            }
            Button("Cancel", role: .cancel) {}
        }
        .accessibilityLabel("\(entry.result == .heads ? entry.headsOption : entry.tailsOption), \(entry.result.label). \(dateString)")
    }
}

#Preview {
    JournalScreen()
        .modelContainer(for: FlipEntry.self, inMemory: true)
}
