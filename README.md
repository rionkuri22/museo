# Overview
A phone app that takes bookmarked content from different platforms into a unified visual mood board. It serves as a shareable visual identity of the user's personality, sense of humor, aesthetic etc.

Why?: I personally don’t create my own content, but I believe "curation is a form of creation." 

# Screen overview with key features
1. Landing page / Home: default board where all content are interactive embeds, meaning users can play videso or scroll through Instagram carousels directly on Museo. Users can also reorder items and/or move them to specific mood boards.
2. Add content: Paste urls here to add to Museo's default board.
3. Boards: See stats like total items shared and their sources. Also see an overview of all user-created boards and "share" them. Right now, the share button just gives all urls of content on board in txt form.

# How to run (from Expo resources)
1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

# What I learned about mobile development
- Even with Expo, many system-level features require complocated extra steps eg) iOS share sheet integration
- Hard to allow AI agent to "see" and fix errors compared to website or webapp where it can just go into Googel Chrome.

# Future features
- Implementing a native iOS Share Extension so users can "Send to Museo" without leaving their current app
- Figure out some way to prevent embedded links from asking for log in
- Develop account making and "follow" system for easy browsing of other people's boards directly within the app