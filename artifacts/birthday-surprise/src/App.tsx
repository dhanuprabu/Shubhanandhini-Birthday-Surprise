import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react';
import memoryPhotoOne from '@/assets/memories/memory-01.webp';
import memoryPhotoTwo from '@/assets/memories/memory-02.webp';
import memoryPhotoThree from '@/assets/memories/memory-03.webp';
import memoryPhotoCollage from '@/assets/memories/memory-04.webp';

const DEFAULT_BIRTHDAY_MESSAGE =
  '❤️🎂 Happy Birthday to my favourite person! 🫶🏻💗';
const DEFAULT_LETTER = `You are not just my best friend, you are someone who holds a very special place in my heart. 🥹❤️ I may not express it every day, but your happiness genuinely matters to me more than you know.

No matter how difficult life gets, I want you to remember one thing — you don't have to face everything alone. Whenever you feel low, whenever the world feels heavy, or whenever you need someone to listen without judging you, I'll be there for you. 🤍🫂

You deserve all the love, peace, happiness, and success this world has to offer. I wish I could protect your smile from every sadness and make all your worries a little lighter. 🥺💖

I may not be able to solve every problem in your life, but I promise I'll always try to stand beside you, support you, care for you, and remind you how precious you are. Never doubt your worth, okay? ❤️✨

And one little promise from my side — no matter how much life changes, I hope you always have a reason to smile, and I hope I can be one of those reasons. 🫶🏻💕

Stay happy, stay strong, and never stop being the beautiful soul you are.

Once again, Happy Birthday, my girl! 🎂👑❤️ You are special to me in ways words can never fully explain. Love you always! 🫂💗🧿`;

const DEFAULT_MEMORY =
  'A thousand little moments, one very special chapter. Those days gave me some of my favorite memories — and the best part is, the story kept going.';
const DEFAULT_GIFT = 'You are my favorite part of every day. ❤️';
const DEFAULT_FINALE = 'Today is your day, but you are my gift every day. I like you! ❤️';

type Photo = { image: string; caption: string };
type SavedContent = {
  name: string;
  birthdayMessage: string;
  letter: string;
  memory: string;
  gift: string;
  finale: string;
  photos: Photo[];
};

const birthdayContent: SavedContent = {
  name: 'Shubhanandhini',
  birthdayMessage: DEFAULT_BIRTHDAY_MESSAGE,
  letter: DEFAULT_LETTER,
  memory: DEFAULT_MEMORY,
  gift: DEFAULT_GIFT,
  finale: DEFAULT_FINALE,
  photos: [
    { image: memoryPhotoOne, caption: 'A bright little moment to keep.' },
    { image: memoryPhotoTwo, caption: 'Good days are better together.' },
    { image: memoryPhotoThree, caption: 'Another memory to treasure.' },
    { image: memoryPhotoCollage, caption: 'A little scrapbook of us.' },
  ],
};

function Icon({ kind }: { kind: 'music' | 'upload' | 'close' }) {
  if (kind === 'music') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
  if (kind === 'upload') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15.5v3A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-3"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

function App() {
  const content = birthdayContent;
  const [started, setStarted] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [giftOpen, setGiftOpen] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [introKey, setIntroKey] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [note, setNote] = useState('');
  const [confetti, setConfetti] = useState(false);
  const confettiCount = window.matchMedia('(max-width:700px)').matches ? 24 : 42;
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const photoCloseRef = useRef<HTMLButtonElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUrlRef = useRef('');
  const ambientTimerRef = useRef<number | null>(null);
  const confettiTimerRef = useRef<number | null>(null);
  const startTimerRef = useRef<number | null>(null);
  const ambientNodesRef = useRef(new Set<OscillatorNode>());

  useEffect(() => {
    if (!started || typingComplete) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedText(content.letter);
      setTypingComplete(true);
      return;
    }
    let position = 0;
    const fullText = content.letter;
    const timer = window.setInterval(() => {
      position += 3;
      setTypedText(fullText.slice(0, position));
      if (position >= fullText.length) {
        window.clearInterval(timer);
        setTypingComplete(true);
      }
    }, 24);
    return () => window.clearInterval(timer);
  }, [started, typingComplete, content.letter]);

  useEffect(() => () => {
    if (ambientTimerRef.current !== null) window.clearInterval(ambientTimerRef.current);
    if (confettiTimerRef.current !== null) window.clearTimeout(confettiTimerRef.current);
    if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);
    ambientNodesRef.current.forEach(node => {
      try { node.stop(); } catch { /* The note may already have ended. */ }
    });
    void audioContextRef.current?.close();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });

  const openPhoto = (photo: Photo, event: MouseEvent<HTMLButtonElement>) => {
    photoTriggerRef.current = event.currentTarget;
    setViewingPhoto(photo);
  };

  useEffect(() => {
    if (!viewingPhoto) {
      photoTriggerRef.current?.focus();
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    photoCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setViewingPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingPhoto]);

  const stopAmbientMusic = () => {
    if (ambientTimerRef.current !== null) {
      window.clearInterval(ambientTimerRef.current);
      ambientTimerRef.current = null;
    }
    ambientNodesRef.current.forEach(node => {
      try { node.stop(); } catch { /* The note may already have ended. */ }
    });
    ambientNodesRef.current.clear();
    setMusicOn(false);
  };

  const toggleMusic = async () => {
    if (audioRef.current && audioUrl) {
      if (audioRef.current.paused) {
        try {
          await audioRef.current.play();
          setMusicOn(true);
        } catch {
          setNote('That audio file could not be played in this browser.');
        }
      } else {
        audioRef.current.pause();
        setMusicOn(false);
      }
      return;
    }
    if (musicOn) {
      stopAmbientMusic();
      return;
    }
    try {
      const AudioContextConstructor = window.AudioContext
        || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error('Web Audio is not supported.');
      const context = audioContextRef.current || new AudioContextConstructor();
      audioContextRef.current = context;
      await context.resume();
      const notes = [392, 493.88, 587.33, 493.88, 440, 392, 329.63, 392];
      let step = 0;
      const playNote = () => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        const start = context.currentTime;
        oscillator.type = 'sine';
        oscillator.frequency.value = notes[step % notes.length];
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(.025, start + .16);
        envelope.gain.exponentialRampToValueAtTime(.001, start + 1.45);
        oscillator.connect(envelope);
        envelope.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 1.5);
        ambientNodesRef.current.add(oscillator);
        oscillator.onended = () => ambientNodesRef.current.delete(oscillator);
        step += 1;
      };
      playNote();
      ambientTimerRef.current = window.setInterval(playNote, 850);
      setMusicOn(true);
    } catch {
      setNote('Audio is unavailable in this browser.');
    }
  };

  const handleAudio = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setNote('Choose an audio file to add a personal song.');
      return;
    }
    stopAmbientMusic();
    if (audioRef.current) audioRef.current.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    const nextUrl = URL.createObjectURL(file);
    audioUrlRef.current = nextUrl;
    setAudioUrl(nextUrl);
    if (audioRef.current) audioRef.current.src = nextUrl;
    setNote('Your song is ready. Tap the music button when you are ready.');
  };

  const startStory = () => {
    setStarted(true);
    if (startTimerRef.current !== null) window.clearTimeout(startTimerRef.current);
    startTimerRef.current = window.setTimeout(() => jumpTo('birthday'), 80);
  };

  const replay = () => {
    if (startTimerRef.current !== null) {
      window.clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (confettiTimerRef.current !== null) {
      window.clearTimeout(confettiTimerRef.current);
      confettiTimerRef.current = null;
    }
    setStarted(false);
    setTypingComplete(false);
    setTypedText('');
    setGiftOpen(false);
    setCandlesOut(false);
    setConfetti(false);
    setViewingPhoto(null);
    setNote('');
    setIntroKey(key => key + 1);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  const celebrate = () => {
    setCandlesOut(true);
    setConfetti(true);
    setConfettiKey(key => key + 1);
    if (confettiTimerRef.current !== null) window.clearTimeout(confettiTimerRef.current);
    confettiTimerRef.current = window.setTimeout(() => {
      setConfetti(false);
      confettiTimerRef.current = null;
    }, 3200);
  };

  return (
    <div className="surprise-app">
      <div className="sky" aria-hidden="true">
        {Array.from({ length: 48 }, (_, index) => (
          <span className="star" key={`star-${index}`} style={{
            left: `${(index * 47 + 7) % 100}%`,
            top: `${(index * 71 + 9) % 100}%`,
            animationDelay: `${(index % 9) * -.47}s`,
            animationDuration: `${3 + (index % 5)}s`,
            opacity: .24 + (index % 5) * .1,
          }} />
        ))}
        {Array.from({ length: 9 }, (_, index) => <span className="float-heart" key={`heart-${index}`} style={{ left: `${8 + index * 11}%`, animationDelay: `${index * -2.8}s`, animationDuration: `${18 + (index % 4) * 4}s` }}>♥</span>)}
      </div>

      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span> A little midnight story</div>
        <div className="tools">
          <button className="icon-button" data-testid="button-toggle-music" type="button" aria-label={musicOn ? 'Pause music' : 'Play music'} title={musicOn ? 'Pause music' : 'Play music'} onClick={() => void toggleMusic()}><Icon kind="music" /></button>
          <button className="icon-button" data-testid="button-choose-song" type="button" aria-label="Choose a personal song" title="Choose a personal song" onClick={() => audioInputRef.current?.click()}><Icon kind="upload" /></button>
          <input ref={audioInputRef} className="audio-file-input" data-testid="input-personal-audio" type="file" accept="audio/*" aria-label="Choose a personal audio file" tabIndex={-1} onChange={handleAudio} />
        </div>
      </header>
      <audio ref={audioRef} preload="none" onEnded={() => setMusicOn(false)} onError={() => { setMusicOn(false); setNote('That audio file could not be played in this browser.'); }} aria-label="Your chosen birthday song" />
      <main className="main-content">
        <section className="hero" id="opening" key={introKey}>
          <span className="eyebrow">A birthday wish, just for you</span>
          <h1>I have a little<br /><em>surprise</em> for you...</h1>
          <p className="hero-sub">A small story made with a very big place in my heart.</p>
          <div className="hero-actions">
            <button className="cta" data-testid="button-open-surprise" type="button" onClick={startStory}>Open Your Surprise ❤️</button>
          </div>
          <div className="progress" aria-label="Story has not started"><i /><i /><i /><i /><i /></div>
        </section>

        {started && <>
          <section className="scene birthday-reveal" id="birthday" aria-live="polite">
            <div className="ribbon">A wish written in the stars</div>
            <h2 className="section-title" data-testid="text-birthday-title">Happy Birthday, My <span>{content.name || 'Shubhanandhini'} ❤️</span></h2>
            <p className="birthday-message" data-testid="text-birthday-message">{content.birthdayMessage}</p>
            <div className="progress" aria-label="Story, chapter one of five"><i className="active" /><i /><i /><i /><i /></div>
            <button className="text-button" data-testid="button-next-to-letter" type="button" onClick={() => jumpTo('letter')}>Turn the page ↓</button>
          </section>

          <div className="section-divider" />
          <section className="scene" id="letter">
            <div className="scene-header">
              <span className="eyebrow">A note from me to you</span>
              <h2 className="section-title">A few words<br /><em style={{ color: 'var(--rose)' }}>from my heart.</em></h2>
              <p className="scene-intro">Some things are easier to say when the whole night is listening.</p>
            </div>
            <div className="letter-wrap">
              <article className="letter-paper">
                <span className="letter-kicker">For {content.name || 'you'}, with love</span>
                <p className={`letter-body ${!typingComplete ? 'typing' : ''}`} data-testid="text-birthday-letter">{typingComplete ? content.letter : typedText}</p>
                <div className="letter-sign" data-testid="text-letter-signature">Dhanu</div>
              </article>
              <div className="letter-tools">
                <button className="quiet-button" data-testid="button-next-to-memory" type="button" onClick={() => jumpTo('memory')}>Keep reading</button>
              </div>
            </div>
          </section>

          <div className="section-divider" />
          <section className="scene" id="memory">
            <div className="scene-header">
              <span className="eyebrow">A page from our story</span>
              <h2 className="section-title">One for the<br /><em style={{ color: 'var(--rose)' }}>memory book.</em></h2>
            </div>
            <article className="memory">
              <div className="memory-art" aria-hidden="true"><span className="memory-icon">✦</span></div>
              <div className="memory-copy">
                <span className="eyebrow">A favorite chapter</span>
                <h3 data-testid="text-special-memory">College Days</h3>
                <p data-testid="text-memory-description">{content.memory}</p>
                <button className="text-button" data-testid="button-next-to-gallery" type="button" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => jumpTo('gallery')}>Look what we kept ↓</button>
              </div>
            </article>
          </section>

          <div className="section-divider" />
          <section className="scene" id="gallery">
            <div className="scene-header">
              <span className="eyebrow">Little pieces of forever</span>
              <h2 className="section-title">Our kind of<br /><em style={{ color: 'var(--rose)' }}>magic.</em></h2>
              <p className="scene-intro">A few of my favorite moments with you, kept close.</p>
            </div>
            <div className="gallery">
              {content.photos.map((photo, index) => (
                <article className="photo-card" key={`photo-${index}`}>
                  <button className="photo-frame" data-testid={`button-view-photo-${index + 1}`} type="button" aria-label={`View photo ${index + 1}: ${photo.caption}`} onClick={event => openPhoto(photo, event)}>
                    <img src={photo.image} alt={photo.caption || `Personal memory ${index + 1}`} data-testid={`img-memory-${index + 1}`} />
                    <span className="photo-zoom-hint" aria-hidden="true">View photo</span>
                  </button>
                  <span className="photo-label">Memory · 0{index + 1}</span>
                  <p className="photo-caption">{photo.caption}</p>
                </article>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button className="cta" data-testid="button-next-to-gift" type="button" onClick={() => jumpTo('gift')}>There’s one more thing</button>
            </div>
          </section>

          <div className="section-divider" />
          <section className="scene gift-stage" id="gift">
            <div className="scene-header">
              <span className="eyebrow">A little something, wrapped up</span>
              <h2 className="section-title">For you,<br /><em style={{ color: 'var(--rose)' }}>with all my heart.</em></h2>
              <p className="scene-intro">Go on. Open it.</p>
            </div>
            <button className={`gift-button ${giftOpen ? 'gift-open' : ''}`} data-testid="button-open-gift" type="button" aria-label={giftOpen ? 'The gift is open' : 'Open your birthday gift'} onClick={() => setGiftOpen(true)}>
              <span className="gift-box"><span className="gift-lid" /><span className="gift-bow" /></span>
            </button>
            {giftOpen && <p className="gift-note" data-testid="text-gift-message" role="status">{content.gift}</p>}
            <button className="text-button" data-testid="button-next-to-cake" type="button" onClick={() => jumpTo('cake')}>One last birthday wish ↓</button>
          </section>

          <div className="section-divider" />
          <section className="scene" id="cake">
            <div className="scene-header">
              <span className="eyebrow">Make a wish, birthday girl</span>
              <h2 className="section-title">A candlelit wish<br /><em style={{ color: 'var(--rose)' }}>for your new year.</em></h2>
              <p className="scene-intro">Take a breath. Make a wish just for you.</p>
            </div>
            <div className={`cake ${candlesOut ? 'flame-out' : ''}`} aria-label={candlesOut ? 'Birthday cake with candles blown out' : 'Birthday cake with three lit candles'} role="img">
              <span className="candle"><i className="flame" /></span>
              <span className="candle"><i className="flame" /></span>
              <span className="candle"><i className="flame" /></span>
              <span className="cake-top" /><span className="cake-base" />
            </div>
            <div className="cake-actions">
              <button className="cta" data-testid="button-blow-candles" type="button" onClick={celebrate}>{candlesOut ? 'Celebrate again' : 'Blow out the candles'}</button>
              <button className="quiet-button" data-testid="button-next-to-finale" type="button" onClick={() => jumpTo('finale')}>I made my wish</button>
            </div>
            {confetti && <div key={confettiKey} className="confetti" data-testid="animation-confetti" aria-hidden="true">{Array.from({ length: confettiCount }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 14) * -.12}s`, animationDuration: `${2.1 + (index % 7) * .18}s`, background: ['#e9bd79', '#ee9db6', '#c8b4e2', '#f5d9bd'][index % 4] }} />)}</div>}
          </section>

          <div className="section-divider" />
          <section className="finale" id="finale">
            <i className="firework" style={{ top: '24%', left: '20%' }} aria-hidden="true" />
            <i className="firework" style={{ top: '26%', right: '20%' }} aria-hidden="true" />
            <i className="firework" style={{ bottom: '25%', left: '30%' }} aria-hidden="true" />
            <span className="eyebrow" style={{ marginBottom: 24 }}>And before the night is over...</span>
            <h2 className="final-message" data-testid="text-final-message">{content.finale}</h2>
            <span className="final-sign">From Dhanu, with love</span>
            <button className="cta replay" data-testid="button-replay" type="button" onClick={replay}>Read it all again</button>
          </section>
        </>}
      </main>
      <footer className="footer-note">Made with affection, under the same night sky · Dhanu</footer>
      {note && <p className="toastline" data-testid="status-message" role="status" style={{ textAlign: 'center', padding: '0 20px 24px' }}>{note}</p>}

      {viewingPhoto && <div className="photo-viewer" data-testid="dialog-photo-viewer" role="presentation" onClick={() => setViewingPhoto(null)}>
        <section className="photo-viewer-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-viewer-caption" onClick={event => event.stopPropagation()}>
          <button ref={photoCloseRef} className="photo-viewer-close icon-button" data-testid="button-close-photo" type="button" aria-label="Close photo" onClick={() => setViewingPhoto(null)}><Icon kind="close" /></button>
          <img className="photo-viewer-image" src={viewingPhoto.image} alt={viewingPhoto.caption} />
          <p className="photo-viewer-caption" id="photo-viewer-caption">{viewingPhoto.caption}</p>
        </section>
      </div>}
    </div>
  );
}

export default App;
