#!/bin/bash

# MindEase - GitHub Issues Creation Script
# This script helps you create GitHub issues from the FUTURE_IMPROVEMENTS.md file
#
# Prerequisites:
# 1. Install GitHub CLI: https://cli.github.com
# 2. Authenticate: gh auth login
# 3. Make this script executable: chmod +x scripts/create_issues.sh
#
# Usage:
#   ./scripts/create_issues.sh              # Interactive mode (shows each issue)
#   ./scripts/create_issues.sh --auto       # Auto-create all issues
#   ./scripts/create_issues.sh --priority   # Only high-priority issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not authenticated with GitHub${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  MindEase Issue Creator${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# High Priority Issues
create_issue_1() {
    echo -e "${YELLOW}Creating Issue #1: Offline Mode...${NC}"
    gh issue create \
        --title "Add offline mode with local queue for mobile app" \
        --label "enhancement,mobile,high-priority" \
        --body "## Description
Implement offline-first functionality where screenshots and voice memos can be captured and analyzed locally, then synced when connection is restored.

## Features
- Local SQLite database for offline storage
- Queue system for pending uploads
- Background sync when network available
- Conflict resolution for simultaneous edits
- Offline indicator in UI
- Retry logic with exponential backoff

## Benefits
- Works in areas with poor connectivity
- Better user experience
- Data never lost
- Faster perceived performance

## Technical Approach
- Use \`expo-sqlite\` for local database
- Implement sync queue with retry logic
- Background tasks with \`expo-background-fetch\`
- Network state monitoring with \`@react-native-community/netinfo\`

## Acceptance Criteria
- [ ] Screenshots captured offline are saved locally
- [ ] Auto-sync when connection restored
- [ ] UI shows sync status
- [ ] No data loss even if app crashes"
}

create_issue_2() {
    echo -e "${YELLOW}Creating Issue #2: Push Notifications...${NC}"
    gh issue create \
        --title "Add push notifications for processing complete" \
        --label "enhancement,mobile,high-priority" \
        --body "## Description
Send push notifications when AI processing is complete, especially for long-running transcriptions.

## Features
- Notification when screenshot analysis complete
- Notification when voice memo transcribed
- Tap notification to view results
- Customizable notification settings
- Badge count for unviewed results

## Technical Approach
- Use \`expo-notifications\` for push notifications
- Backend webhook to trigger notifications
- Local notifications for immediate feedback
- Remote notifications via FCM/APNs for background processing

## Acceptance Criteria
- [ ] User receives notification when processing done
- [ ] Notifications work in background
- [ ] Tapping notification opens result
- [ ] User can disable notifications in settings"
}

create_issue_3() {
    echo -e "${YELLOW}Creating Issue #3: Share Extension...${NC}"
    gh issue create \
        --title "Implement share extension for iOS/Android" \
        --label "enhancement,mobile,high-priority" \
        --body "## Description
Allow users to share screenshots from other apps directly to MindEase for analysis.

## Features
- Share from Photos app
- Share from browser (save webpage screenshot)
- Share from other apps
- Immediate analysis workflow
- Optional voice memo during share

## Benefits
- Seamless integration with device
- Capture from anywhere
- More convenient workflow

## Technical Approach
- iOS Share Extension
- Android Share Intent
- Custom URI scheme
- Deep linking support

## Acceptance Criteria
- [ ] Share from Photos works
- [ ] Share from browser works
- [ ] Opens app with shared image
- [ ] Triggers analysis workflow"
}

create_issue_4() {
    echo -e "${YELLOW}Creating Issue #4: On-Device ML...${NC}"
    gh issue create \
        --title "Add on-device ML for faster OCR" \
        --label "enhancement,performance,ml,high-priority" \
        --body "## Description
Implement on-device text recognition to provide instant OCR results before backend processing.

## Features
- On-device OCR using ML Kit or Vision API
- Instant text extraction (< 1 second)
- Offline OCR capability
- Backend OCR as enhancement
- Show preview of extracted text immediately

## Benefits
- Much faster user feedback
- Works offline
- Reduces backend load
- Better user experience

## Technical Approach
- iOS: Use Vision framework
- Android: Use ML Kit Text Recognition
- React Native bridge or use \`react-native-mlkit\`
- Hybrid approach: on-device + backend

## Acceptance Criteria
- [ ] Text extraction in < 1 second
- [ ] Works without internet
- [ ] High accuracy (>90%)
- [ ] Graceful fallback to backend"
}

create_issue_5() {
    echo -e "${YELLOW}Creating Issue #5: Dark Mode...${NC}"
    gh issue create \
        --title "Add dark mode support" \
        --label "enhancement,ui,mobile,web" \
        --body "## Description
Implement dark mode theme for both web and mobile apps.

## Features
- System-based auto dark mode
- Manual toggle in settings
- Dark theme for all screens
- Proper contrast ratios
- Smooth transition animations

## Technical Approach
- Use React Context for theme state
- CSS variables for web (Tailwind dark mode)
- React Native appearance API
- Persist user preference

## Acceptance Criteria
- [ ] Dark mode toggle in settings
- [ ] Follows system preference by default
- [ ] All screens support dark mode
- [ ] Images/screenshots clearly visible
- [ ] Accessible contrast ratios"
}

# Quick issues for demonstration
create_quick_issues() {
    echo -e "${GREEN}Creating 5 high-priority issues...${NC}"
    create_issue_1
    create_issue_2
    create_issue_3
    create_issue_4
    create_issue_5
    echo -e "${GREEN}✓ Issues created successfully!${NC}"
}

# Interactive mode
interactive_mode() {
    echo "This script will help you create GitHub issues for MindEase improvements."
    echo ""
    echo "Options:"
    echo "  1) Create all high-priority issues (5 issues)"
    echo "  2) Create issues one by one (interactive)"
    echo "  3) View full list and create manually"
    echo "  4) Exit"
    echo ""
    read -p "Choose an option (1-4): " choice

    case $choice in
        1)
            create_quick_issues
            ;;
        2)
            echo -e "${YELLOW}Creating issues interactively...${NC}"
            read -p "Create Issue #1 - Offline Mode? (y/n): " confirm
            [[ $confirm == "y" ]] && create_issue_1

            read -p "Create Issue #2 - Push Notifications? (y/n): " confirm
            [[ $confirm == "y" ]] && create_issue_2

            read -p "Create Issue #3 - Share Extension? (y/n): " confirm
            [[ $confirm == "y" ]] && create_issue_3

            read -p "Create Issue #4 - On-Device ML? (y/n): " confirm
            [[ $confirm == "y" ]] && create_issue_4

            read -p "Create Issue #5 - Dark Mode? (y/n): " confirm
            [[ $confirm == "y" ]] && create_issue_5

            echo -e "${GREEN}✓ Done!${NC}"
            ;;
        3)
            echo -e "${BLUE}Opening FUTURE_IMPROVEMENTS.md...${NC}"
            echo "Please create issues manually from: FUTURE_IMPROVEMENTS.md"
            echo "Total issues available: 46"
            echo ""
            echo "To create an issue manually:"
            echo "1. Go to: https://github.com/YOUR_USERNAME/mindease/issues/new"
            echo "2. Copy title and description from FUTURE_IMPROVEMENTS.md"
            echo "3. Add labels and submit"
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            exit 1
            ;;
    esac
}

# Parse command line arguments
case "${1:-}" in
    --auto)
        echo -e "${YELLOW}Auto-creating high-priority issues...${NC}"
        create_quick_issues
        ;;
    --priority)
        echo -e "${YELLOW}Creating only high-priority issues...${NC}"
        create_quick_issues
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  (no args)    Interactive mode"
        echo "  --auto       Auto-create all high-priority issues"
        echo "  --priority   Create only high-priority issues"
        echo "  --help       Show this help message"
        echo ""
        echo "See FUTURE_IMPROVEMENTS.md for full list of 46 issues"
        ;;
    *)
        interactive_mode
        ;;
esac

echo ""
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}View all 46 improvement ideas in:${NC}"
echo -e "${BLUE}FUTURE_IMPROVEMENTS.md${NC}"
echo -e "${BLUE}==================================${NC}"
