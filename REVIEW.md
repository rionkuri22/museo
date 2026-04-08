# Museo Project Code Review

This review evaluates the Museo codebase against the requirements and acceptance criteria defined in `SPEC.md`.

## Summary Table

| Requirement | Status | File Reference |
| :--- | :--- | :--- |
| Interactive Previews | [FAIL] | [EmbedCard.tsx](file:///Users/rion/Desktop/Github/my-app/components/EmbedCard.tsx#L64) |
| Reliable Data Persistence | [FAIL] | [useMuseoStore.ts](file:///Users/rion/Desktop/Github/my-app/store/useMuseoStore.ts#L84-L88) |
| Pinterest `pin.it` Support | [FAIL] | [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts#L44-L49) |
| Instagram Reels Support | [WARN] | [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts#L34-L37) |
| Masonry Layout | [PASS] | [index.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/index.tsx#L33-L34) |
| Platform Identification | [PASS] | [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts#L13-L20) |
| Navigation (Back Buttons) | [PASS] | [stats.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/stats.tsx#L55) |
| Error Handling (Input) | [PASS] | [add.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/add.tsx#L15-L24) |
| Offline Connectivity | [PASS] | [OfflineBanner.tsx](file:///Users/rion/Desktop/Github/my-app/components/OfflineBanner.tsx) |
| Content Unavailable Support | [PASS] | [EmbedCard.tsx](file:///Users/rion/Desktop/Github/my-app/components/EmbedCard.tsx#L55-L65) |

---

## Findings

### 1. [FAIL] Previews are not interactive
**File:** [EmbedCard.tsx](file:///Users/rion/Desktop/Github/my-app/components/EmbedCard.tsx#L64)
- **Detail:** The `WebView` has `pointerEvents="none"`, which effectively blocks all user interactions with the embedded content.
- **Impact:** Users cannot press play on videos, scroll through carousels, or interact with embeds as required by Acceptance Criteria (SPEC line 26).

### 2. [FAIL] Data Persistence Size Limit
**File:** [useMuseoStore.ts](file:///Users/rion/Desktop/Github/my-app/store/useMuseoStore.ts#L84-L88)
- **Detail:** The store uses `expo-secure-store` for persistence. On iOS, `SecureStore` has a strict **2,048 byte limit** per key. 
- **Impact:** As the user adds more links, the stringified JSON store will quickly exceed this limit, causing the app to stop saving new items or fail to load data entirely. This violates the core persistence requirement (SPEC line 3).

### 3. [FAIL] Pinterest Shortened Links (`pin.it`)
**File:** [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts#L44-L49)
- **Detail:** While `pin.it` is detected as a Pinterest platform, the embed logic only uses a regex matching `/pin/(\d+)/`.
- **Impact:** Shortened links like `https://pin.it/7rS7s9eQa` (explicitly mentioned in SPEC line 33) do not contain the pin ID in the URL itself and will fail to generate an embed URL, resulting in a broken card or fallback.

### 4. [WARN] Missing Instagram Reels Support
**File:** [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts#L34-L37)
- **Detail:** The Instagram embed logic specifically looks for `/p/` (posts).
- **Impact:** Instagram Reels (`/reels/`) will fail to generate an embed preview even though they are a primary content type on the platform.

### 5. [WARN] Naive Masonry implementation
**File:** [index.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/index.tsx#L33-L34)
- **Detail:** The "staggered grid" is implemented by splitting the items array into odd/even indices for two columns.
- **Impact:** This doesn't account for the actual height of the cards. If one column contains several tall TikToks while the other has short YouTube embeds, the columns will become significantly misaligned at the bottom.

### 6. [PASS] Link Validation and Platform Identification
**Files:** [add.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/add.tsx#L15-L24), [share-utils.ts](file:///Users/rion/Desktop/Github/my-app/utils/share-utils.ts)
- **Detail:** The app correctly distinguishes between generic text and links, and identifies the platform correctly for stats.
- **Requirement:** Satisfies "Error handling" for unsupported links and "Correctly identify the platform" (SPEC lines 18-19, 29).

### 7. [PASS] Navigation and Board Management
**Files:** [stats.tsx](file:///Users/rion/Desktop/Github/my-app/app/(tabs)/stats.tsx), [board/[id].tsx](file:///Users/rion/Desktop/Github/my-app/app/board/[id].tsx)
- **Detail:** Navigation between the main board, stats, and specific boards is seamless. Board items can be tagged and deleted via the long-press menu.
- **Requirement:** Satisfies navigation and management rules (SPEC lines 28, 30).

### 8. [PASS] Connectivity and Availability Handlers
**Files:** [OfflineBanner.tsx](file:///Users/rion/Desktop/Github/my-app/components/OfflineBanner.tsx), [EmbedCard.tsx](file:///Users/rion/Desktop/Github/my-app/components/EmbedCard.tsx#L55)
- **Detail:** The "No Connection" banner and "Content unavailable" placeholder are correctly implemented.
- **Requirement:** Satisfies error handling for offline/deleted content (SPEC lines 20-21).
