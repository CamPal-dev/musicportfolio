const handmadePlay = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M21 3C10 2 3 10 3 21S12 38 22 37 38 28 37 18 30 2 21 3 M16 11Q23 15 29 20L15 29Q17 19 16 11"/></svg>';
const handmadePause = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M21 3C10 2 3 10 3 21S12 38 22 37 38 28 37 18 30 2 21 3 M16 12Q15 21 16 28M24 12Q25 20 24 28"/></svg>';
const tracks = [...document.querySelectorAll('.track')];
const filters = [...document.querySelectorAll('[data-filter]')];
const players = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let audioContext;

function filterMusic(category) {
  filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  tracks.forEach(track => {
    track.hidden = category !== 'all' && !track.dataset.categories.split(' ').includes(category);
  });
  players.forEach(player => { if (player.track.hidden) player.audio.pause(); });
  const count = tracks.filter(track => !track.hidden).length;
  document.querySelector('.filter-status').textContent = `${count} ${count === 1 ? 'track' : 'tracks'} · ${category}`;
}
filters.forEach(button => button.addEventListener('click', () => filterMusic(button.dataset.filter)));

tracks.forEach(track => {
  const tags = document.createElement('div');
  tags.className = 'track-tags';
  track.dataset.categories.split(' ').forEach(category => {
    const tag = document.createElement('button');
    tag.type = 'button';
    tag.className = 'track-tag';
    tag.textContent = category === 'songs' ? 'finished songs' : category;
    tag.setAttribute('aria-label', `Show ${category}`);
    tag.addEventListener('click', () => {
      const targetCategory = category === 'italiano' ? 'demos' : category;
      if (songDialog.open) songDialog.close();
      filterMusic(targetCategory);
      filters.find(button => button.dataset.filter === targetCategory).focus({ preventScroll: true });
      document.querySelector('.music-filters').scrollIntoView({ block: 'center' });
    });
    tags.append(tag);
  });
  track.querySelector('.track-tags').replaceWith(tags);
  const player = track.querySelector('.player');
  const button = player.querySelector('.play');
  const canvas = player.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const status = player.querySelector('.player-status');
  const title = track.querySelector('h3').textContent;
  let analyser, samples, frame;
  const audio = new Audio();
  audio.preload = 'metadata';
  players.push({ track, audio });

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const active = analyser && !audio.paused && !audio.ended && !reducedMotion.matches;
    if (active) analyser.getByteTimeDomainData(samples);
    for (let i = 0; i <= 160; i++) {
      const amplitude = active ? (samples[Math.min(samples.length - 1, Math.floor(i / 160 * samples.length))] - 128) / 128 : 0;
      const x = i / 160 * width;
      const y = height / 2 + amplitude * height * .35;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    if (active) frame = requestAnimationFrame(draw);
  }
  function refresh() {
    cancelAnimationFrame(frame);
    const playing = !audio.paused && !audio.ended;
    button.innerHTML = playing ? handmadePause : handmadePlay;
    button.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${title}`);
    player.classList.toggle('is-playing', playing);
    draw();
  }
  new ResizeObserver(() => { cancelAnimationFrame(frame); draw(); }).observe(canvas);
  reducedMotion.addEventListener('change', refresh);
  button.disabled = !player.dataset.audio.trim();
  if (button.disabled) {
    button.setAttribute('aria-label', `${title} — audio coming soon`);
    button.title = 'Audio coming soon';
    return;
  }
  audio.src = player.dataset.audio;
  status.textContent = 'ready to listen';
  track.querySelector('.availability').textContent = 'Ready to listen.';
  function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }
  audio.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audio.duration)) track.querySelector('.duration').textContent = formatTime(audio.duration);
  });
  const seek = track.querySelector('.seek');
  audio.addEventListener('timeupdate', () => {
    status.textContent = formatTime(audio.currentTime);
    if (Number.isFinite(audio.duration)) seek.value = audio.currentTime / audio.duration * 100;
  });
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 100 * audio.duration; });
  ['play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, refresh));
  audio.addEventListener('error', () => { status.textContent = 'audio unavailable'; refresh(); });
  button.addEventListener('click', async () => {
    if (!audio.paused) { audio.pause(); return; }
    document.querySelectorAll('video').forEach(video => video.pause());
    players.forEach(other => { if (other.audio !== audio) other.audio.pause(); });
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass && location.protocol !== 'file:') {
        audioContext ||= new AudioContextClass();
        if (!analyser) {
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 1024;
          samples = new Uint8Array(analyser.fftSize);
          audioContext.createMediaElementSource(audio).connect(analyser);
          analyser.connect(audioContext.destination);
        }
        await audioContext.resume();
      }
      await audio.play();
      if (track.hidden) audio.pause();
    } catch (error) {
      audio.pause();
      status.textContent = 'unable to play — try again';
      refresh();
    }
  });
});
filterMusic('all');

// Reuse each track's live controls inside its notebook page.
const songDialog = document.querySelector('#song-dialog');
let notebookTrack;
function updateSongTime() {
  if (!notebookTrack) return;
  const audio = players.find(player => player.track === notebookTrack).audio;
  const format = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '—';
  songDialog.querySelector('.song-time').textContent = `${format(audio.currentTime)} / ${format(audio.duration)}`;
}
players.forEach(({ audio }) => {
  audio.addEventListener('timeupdate', updateSongTime);
  audio.addEventListener('loadedmetadata', updateSongTime);
});
function closeNotebook() { songDialog.close(); }
songDialog.querySelector('.dialog-close').addEventListener('click', closeNotebook);
songDialog.addEventListener('close', () => {
  if (!notebookTrack) return;
  const livePlayer = songDialog.querySelector('.player');
  if (livePlayer) notebookTrack.querySelector('.track-title-row').after(livePlayer);
  const detail = songDialog.querySelector('.track-detail');
  if (detail) { detail.hidden = true; notebookTrack.append(detail); }
  notebookTrack.querySelector('.expand').setAttribute('aria-expanded', 'false');
  notebookTrack = null;
});
document.querySelectorAll('.expand').forEach(button => {
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-controls', 'song-dialog');
  button.addEventListener('click', () => {
    notebookTrack = button.closest('.track');
    const notes = window.songNotes?.[notebookTrack.querySelector('.player').dataset.audio] || {};
    songDialog.querySelector('#song-title').textContent = notebookTrack.querySelector('h3').textContent;
    songDialog.querySelector('#song-number').textContent = notebookTrack.querySelector('.track-index').textContent;
    songDialog.querySelector('.song-category').textContent = notebookTrack.querySelector('.meta').textContent;
    for (const [field, placeholder] of [['lyrics', 'words still to be written here…'], ['origin', 'the beginning of this one — coming soon.'], ['context', 'a few notes for another day.']]) {
      const element = songDialog.querySelector('.song-' + field);
      element.textContent = notes[field] || placeholder;
      element.classList.toggle('not-yet', !notes[field]);
    }
    const livePlayer = notebookTrack.querySelector('.player');
    songDialog.querySelector('.notebook-player').prepend(livePlayer);
    const photo = songDialog.querySelector('.song-photo img');
    photo.hidden = !notes.photo;
    if (notes.photo) { photo.src = notes.photo; photo.alt = notes.photoAlt || ''; } else { photo.removeAttribute('src'); }
    songDialog.querySelector('.photo-placeholder').hidden = !!notes.photo;
    songDialog.querySelector('figcaption').textContent = notes.caption || 'notes from somewhere ↶';
    updateSongTime();
    const detail = notebookTrack.querySelector('.track-detail');
    detail.hidden = false;
    songDialog.querySelector('.song-controls').append(detail);
    button.setAttribute('aria-expanded', 'true');
    songDialog.showModal();
  });
});
document.querySelectorAll('.video-preview').forEach(button => {
  const video = document.createElement('video');
  video.className = 'inline-video';
  video.controls = true;
  video.playsInline = true;
  video.preload = 'none';
  video.src = button.dataset.video;
  video.poster = button.querySelector('img').src;
  video.setAttribute('aria-label', button.closest('.video-card').querySelector('h3').textContent);
  video.hidden = true;
  button.after(video);
  button.addEventListener('click', async () => {
    button.hidden = true;
    video.hidden = false;
    video.focus();
    try { await video.play(); } catch { /* Native controls allow retrying playback. */ }
  });
});
songDialog.addEventListener('click', event => {
  const box = songDialog.getBoundingClientRect();
  if (event.target === songDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) songDialog.close();
});
const dialog = document.querySelector('#info-dialog');
function showInfo(title, copy) {
  dialog.querySelector('h2').textContent = title;
  dialog.querySelector('p').textContent = copy;
  dialog.showModal();
}
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.dialog === 'about') showInfo('about', 'I’m a songwriter, vocalist, and producer interested in intimate writing, atmospheric production, strange little harmonies, and the spaces between polished and raw. This is a small collection of originals, covers, and things still becoming themselves.');
  else {
    showInfo('get in touch', '');
    const contact = dialog.querySelector('p');
    const email = document.createElement('a');
    email.href = 'mailto:camillamcpalermo@gmail.com';
    email.textContent = 'camillamcpalermo@gmail.com';
    const phone = document.createElement('a');
    phone.href = 'tel:+31622332310';
    phone.textContent = '+31622332310';
    contact.append('email: ', email, document.createElement('br'), 'whatsapp: @campalermos', document.createElement('br'), 'phone: ', phone);
  }
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });

document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => {
    players.forEach(player => player.audio.pause());
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
});

// Floating navigation and a compact mobile disclosure.
const header = document.querySelector('.site-header');
const menuToggle = header.querySelector('.menu-toggle');
const navigation = header.querySelector('nav');
const mobileNavigation = window.matchMedia('(max-width: 650px)');
function setMenu(open, restoreFocus = false) {
  header.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  navigation.inert = mobileNavigation.matches && !open;
  if (restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => {
  if (event.target.closest('a, button')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) setMenu(false, true);
});
document.addEventListener('click', event => {
  if (!header.contains(event.target)) setMenu(false);
});
header.addEventListener('focusout', () => {
  requestAnimationFrame(() => { if (!header.contains(document.activeElement)) setMenu(false); });
});
mobileNavigation.addEventListener('change', () => setMenu(false));
setMenu(false);
function updateHeader() { header.classList.toggle('is-scrolled', window.scrollY > 24); }
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
// Three musical directions, with standard keyboard tab navigation.
const directionTabs = [...document.querySelectorAll('.direction-tabs [role="tab"]')];
function selectDirection(index) {
  directionTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
  });
}
directionTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectDirection(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % directionTabs.length;
    if (event.key === 'ArrowLeft') next = (index + directionTabs.length - 1) % directionTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = directionTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectDirection(next); directionTabs[next].focus(); }
  });
});
const albumCards = [...document.querySelectorAll('.album-card')];
const albumDots = [...document.querySelectorAll('[data-slide]')];
let albumIndex = 0;
function selectAlbum(index, announce = true) {
  albumIndex = (index + albumCards.length) % albumCards.length;
  albumCards.forEach((card, i) => {
    card.classList.toggle('is-current', i === albumIndex);
    const previous = (albumIndex - 1 + albumCards.length) % albumCards.length;
    const next = (albumIndex + 1) % albumCards.length;
    card.hidden = i !== previous && i !== albumIndex && i !== next;
    card.style.order = (i - albumIndex + 1 + albumCards.length) % albumCards.length;
  });
  albumDots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === albumIndex)));
  if (announce) document.querySelector('.carousel-announcement').textContent = albumCards[albumIndex].querySelector('h3').textContent;
}
document.querySelector('.carousel-arrow.prev').addEventListener('click', () => selectAlbum(albumIndex - 1));
document.querySelector('.carousel-arrow.next').addEventListener('click', () => selectAlbum(albumIndex + 1));
albumDots.forEach((dot, index) => dot.addEventListener('click', () => selectAlbum(index)));
selectAlbum(0, false);
