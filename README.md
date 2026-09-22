# Cam Palermo Music Portfolio

Open http://localhost:8000 after running `python3 -m http.server 8000 --bind 127.0.0.1` in this folder. An HTTP preview enables the audio-reactive waveform. Directly opening index.html supports playback but uses a still line because browsers restrict analysis of local files.

## Media
13 recordings and 4 videos were imported from the SONGZ folders. Originals were left untouched. Browser copies are in audio/ (MP3) and videos/ (H.264/AAC MP4 and poster images). media-library.json records their source filenames. Both two in one versions are retained. Titles preserve source filenames; no dates or credits were invented.

Filters: All, Finished songs (4), Covers (4), Demos (5, including both Italian recordings). Italian tracks retain an italiano tag. The + buttons reveal tags and seeking controls. Only one audio or video plays at a time.

## Editing
Track markup and data-audio paths live in index.html. To add a recording, copy a track article, give its note a unique ID, set its source, title, and data-categories (songs, covers, demos, or demos italiano). Video cards use native playback controls. Contact and profile links remain placeholders.

The photo background is an AI-edited reconstruction of the reference screenshot. The design remains static HTML/CSS/JS with no build step. This is a local site; it has not been published.

## Songbook and video strip
The + button opens a notebook popup. Edit song-notes.js to add each song's lyrics, origin, and context; keys match data-audio paths. Empty fields intentionally show placeholders. Lyrics preserve line breaks. Escape, the close button, or clicking outside closes the popup, restoring focus. Track playback can continue while reading.

Video cards play in place with native controls; starting another song or video pauses the previous media. On phones the card strip scrolls horizontally. The background photograph lives on a masked pseudo-element so the desktop side and bottom fades also apply to replacement images without fading the content.

## Expanded About and directions
About now contains the supplied biography, origin story, and musical identity copy. Three accessible tabs select big time influences, current direction, and another direction. The influence carousel supports arrows and dot selectors. Photos and moodboard compositions are displayed from the four supplied reference images in assets/about-reference-*.png; these are illustrative reference artwork, not independently sourced album covers. Track-list arrows open Spotify searches. The two playlist embeds await the owner's actual playlist URLs; no playlist has been created or published. Edit section text and track references in index.html.


Both musical direction panels now contain live Spotify playlist embeds (352px tall), with direct Spotify links. Album artwork is awaiting owner-supplied images.
