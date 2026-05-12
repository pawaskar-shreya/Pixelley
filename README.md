# Pixelley

Your Pixel Alley on the Internet!

## Demo Video

[Pixelley-demo.webm](https://github.com/user-attachments/assets/fe3a35ab-54fe-4264-933a-84d83a4f2215)


## Description

Pixelley is a lightweight metaverse app built for teams and communities who want a shared virtual presence without the overhead of a full 3D engine or a heavy client install. Users sign in, pick a space from their dashboard, and enter it as a pixel-art avatar that others can see moving in real time. Spaces are predefined and curated each with their own theme, background, and set of placeable elements.
The focus is on simplicity and performance. No downloads, no setup. Just sign in, walk around and chat with your team mates!

## Features

- Real-time user position updates: See other users move around the space live over WebSocket. Positions are broadcast with smooth interpolation so nobody teleports.
- Animated avatars: Users animate with directional walk cycles (up, down, left, right) and return to idle when stationary. Male and female avatars with 5 sprite states each.
- Predefined spaces: Curated environments rendered with pixel-art tilesets. Spaces load their own assets independently so only what you need is fetched.
- Element placement: Browse space-specific elements like office desk, plants and many more and place them anywhere on the map. Elements persist across sessions for all users in that space.
- Element deletion: Remove elements you placed. No user can delete elements placed by other user. Default elements are protected and cannot be deleted.
- Collision system: Collidable elements like walls and furniture block movement. Non-collidable ones like rugs, floor decals let you walk over them freely.
- Online users: See who all from your team has joined the space and is currently active.
- Live Chat: All the joined users can chat with their team mates over a chat dedicated to their own space. 

## Technologies Used

### Frontend

- React: UI and dashboard
- Phaser 3: Game engine for rendering spaces, avatars, animations, and collision
- WebSocket (native): Real-time position and element sync

### Backend

- Node.js: HTTP and WebSocket server
- PostgreSQL: Persistent storage for users, spaces, elements, and placements
- Prisma: ORM and schema management

### Infrastructure

- Cloudflare R2: Object storage for avatar sprites, element images, and tilemap JSON files

## Credits

- [Office Pixel Assets by Arlan_TR](https://arlantr.itch.io/free-office-pixel-art)
- [MCU Tribute Pack by everlyspixelsandpens](https://everlywritesgames.itch.io/mcu-tribute-character-pack)

