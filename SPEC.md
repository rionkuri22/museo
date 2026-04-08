Create a new app for iPhone (iOS) called Museo using Expo. I already have it ready to test on a phone setup using Expo Go.

It needs to have data persistence, meaning that when the user closes the app and opens it again, the content should still be there.

# Key features explained in order of user flow:
## Adding content to Museo
- User is on other apps eg) Safari, Youtube, TikTok, Instagram, Pinterest etc. and finds some form of content (image or video) that they want to add to museo
- User stays in that app and pushes "share" button to find museo in the share sheet
- User taps on museo in the share sheet. At this point, the URL to the contet is already passed into Museo in the background and made ready to embed
## Landing page
- User opens Museo and is presented with a default board with previews of all the content they had shared recently in a staggered grid layout
- User can scroll through the board and, see, watch/hear the content without havinvg to leave Museo
- When long press on preview card, it opens a small popup with options to delete, or to tag the it to a specific board eg) "funny" that already exists or they want to create new.
## 2nd screen 
- When user navigates to this page using tab bar at the bottom of the screen, show at the top stats of how much content has been shared from each platform eg) Youtube, TikTok, Instagram, Pinterest etc. Make sure this does not take up too much screen space. 
- Right under the stats, show a list of all boards that the user has created
- When user taps on a board in the list, it opens the board and shows all the content that the user has shared to that board

# Error handling
- If a user tries to share text and not a link, show a popup to let the user know: "Oops! Museo only supports links."
- If a user tries to share a link that is not supported, show a popup to let the user know: "Oops! Museo doesn't support this."
- If the content is deleted by the original creator, show a placeholder image with the message: "Content unavailable"
- Since embeds require the internet, show a "No Connection" banner when offline.

# Acceptance criteria
- The content should be embeded in the app in a way that allows user to view the original content without leaving Museo. 
- Whatever I have in my board, it should be there when I close the app entirely and reopen it 
- I must be able to navigate out of all popups and between screens with x buttons and/or back buttons
- The app should have a consistent color palette
- The app should correctly identify the platform of the shared link
- Test with the following links
https://youtu.be/-UA4wU67Ox4?si=amFjqYl5wznKgHQu
https://pin.it/7rS7s9eQa
https://www.instagram.com/p/DL4w7SOvaan/?utm_source=ig_web_button_share_sheet&igsh=MzRlODBiNWFlZA==
https://x.com/riyazz_ai/status/2041613478633570716?s=20
https://www.wired.com/story/anthropic-launches-claude-managed-agents/