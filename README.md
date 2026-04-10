# Overview
A digital "Identity Dashboard" that transforms fragmented bookmarks into a curated visual mood board.
Personal museum that can be shared with others as representation of self, sense of humor, aesthetics etc.

# Screen details
1. Landing page / Home: default board with all embedded content. where go especially after just adding to Museo and need to assign to a specific board
2. Add content: Paste urls here to add to Museo
3. Boards: See stats like total items shared and which platform from

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
- Even with Expo, many native features require manu complocated extra steps eg) iOS share sheet integration


# Future features
- Making adding content to Museo more seamless with iOS share sheet
- Figure out some way to prevent embedded link from asking for log in (esp seems to happen often for Pinterest)
- Log in, finding and following other accounts
- Consider again if there really isn't a way to crop tweet preview into 1 column