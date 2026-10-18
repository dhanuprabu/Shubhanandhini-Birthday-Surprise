import { useEffect, useRef, useState, type ChangeEvent } from 'react';

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
const STORAGE_KEY = 'dhanu-birthday-surprise-v1';

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

const initialSaved: SavedContent = {
  name: 'Shubhanandhini',
  birthdayMessage: DEFAULT_BIRTHDAY_MESSAGE,
  letter: DEFAULT_LETTER,
  memory: DEFAULT_MEMORY,
  gift: DEFAULT_GIFT,
  finale: DEFAULT_FINALE,
  photos: [
    { image: '', caption: 'The days that started it all.' },
    { image: '', caption: 'A moment I want to keep.' },
    { image: '', caption: 'And all the memories still to come.' },
  ],
};

function loadSaved(): SavedContent {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return initialSaved;
    const parsed = JSON.parse(value) as Partial<SavedContent>;
    return {
      ...initialSaved,
      ...parsed,
      photos: Array.isArray(parsed.photos) && parsed.photos.length === 3
        ? parsed.photos
        : initialSaved.photos,
    };
  } catch {
    return initialSaved;
  }
}

function Icon({ kind }: { kind: 'music' | 'settings' | 'close' | 'sound' }) {
  if (kind === 'music') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>;
  if (kind === 'settings') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.1 1.9-1.8 3.1-2.2-.1-.2.1-1.1 1.3h-3.6l-1.1-1.8-.2-.1-2.2.1-1.8-3.1 1.1-1.9-.1-.2-.1-2.2-1.2-1.4 1.8-3.1 2.2.1.2-.1 1.1-1.9h3.6l1.1 1.9.2.1 2.2-.1 1.8 3.1-1.1 1.9.1.2z"/></svg>;
  if (kind === 'sound') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>;
}

function App() {
  const [content, setContent] = useState<SavedContent>(loadSaved);
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [giftOpen, setGiftOpen] = useState(false);
  const [candlesOut, setCandlesOut] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioName, setAudioName] = useState('');
  const [note, setNote] = useState('');
  const [confetti, setConfetti] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUrlRef = useRef('');
  const ambientTimerRef = useRef<number | null>(null);
  const ambientNodesRef = useRef(new Set<OscillatorNode>());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      setNote('');
    } catch {
      setNote('Some photos are too large for this browser to save. They will stay visible until you close this page.');
    }
  }, [content]);

  useEffect(() => {
    if (!started || typingComplete || editingLetter) return;
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
  }, [started, typingComplete, editingLetter, content.letter]);

  useEffect(() => () => {
    if (ambientTimerRef.current !== null) window.clearInterval(ambientTimerRef.current);
    ambientNodesRef.current.forEach(node => {
      try { node.stop(); } catch { /* The note may already have ended. */ }
    });
    void audioContextRef.current?.close();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const update = (key: keyof Omit<SavedContent, 'photos'>, value: string) => {
    setContent(current => ({ ...current, [key]: value }));
  };

  const updatePhoto = (index: number, field: keyof Photo, value: string) => {
    setContent(current => ({
      ...current,
      photos: current.photos.map((photo, photoIndex) => photoIndex === index ? { ...photo, [field]: value } : photo),
    }));
  };

  const fileToDataUrl = (file: File, callback: (value: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result || ''));
    reader.onerror = () => setNote('That photo could not be opened. Try another image.');
    reader.readAsDataURL(file);
  };

  const handlePhoto = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNote('Choose an image file to add a memory.');
      return;
    }
    fileToDataUrl(file, value => updatePhoto(index, 'image', value));
  };

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });

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
      const context = audioContextRef.current || new AudioContext();
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
    setAudioName(file.name);
    if (audioRef.current) audioRef.current.src = nextUrl;
    setNote('Your song is ready. Tap Play music whenever you are ready.');
  };

  const startStory = () => {
    setStarted(true);
    window.setTimeout(() => jumpTo('birthday'), 50);
  };

  const replay = () => {
    setStarted(false);
    setTypingComplete(false);
    setTypedText('');
    setEditingLetter(false);
    setGiftOpen(false);
    setCandlesOut(false);
    setConfetti(false);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  const celebrate = () => {
    setCandlesOut(true);
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 3200);
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
          <span className="separator" aria-hidden="true" />
          <button className="icon-button" data-testid="button-open-personalization" type="button" aria-label="Personalize your surprise" title="Personalize" onClick={() => setSettingsOpen(true)}><Icon kind="settings" /></button>
        </div>
      </header>
      <audio ref={audioRef} onEnded={() => setMusicOn(false)} aria-label="Your chosen birthday song" />
      <main className="main-content">
        <section className="hero" id="opening">
          <span className="eyebrow">A birthday wish, just for you</span>
          <h1>I have a little<br /><em>surprise</em> for you...</h1>
          <p className="hero-sub">A small story made with a very big place in my heart.</p>
          <div className="hero-actions">
            <button className="cta" data-testid="button-open-surprise" type="button" onClick={startStory}>Open Your Surprise ❤️</button>
            <button className="text-button" data-testid="button-personalize-first" type="button" onClick={() => setSettingsOpen(true)}>Make it yours first</button>
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
                {editingLetter
                  ? <textarea className="letter-edit" data-testid="input-birthday-letter" aria-label="Edit your birthday letter" value={content.letter} onChange={event => update('letter', event.target.value)} />
                  : <p className={`letter-body ${!typingComplete ? 'typing' : ''}`} data-testid="text-birthday-letter">{typingComplete ? content.letter : typedText}</p>}
                <div className="letter-sign" data-testid="text-letter-signature">Dhanu</div>
              </article>
              <div className="letter-tools">
                <button className="quiet-button" data-testid="button-edit-letter" type="button" onClick={() => {
                  if (!editingLetter) {
                    setEditingLetter(true);
                    setTypingComplete(true);
                    setTypedText(content.letter);
                  } else {
                    setEditingLetter(false);
                    setTypedText(content.letter);
                    setTypingComplete(true);
                  }
                }}>{editingLetter ? 'Save letter' : 'Edit this letter'}</button>
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
                <textarea className="inline-edit" data-testid="input-special-memory" aria-label="Edit the College Days memory" value={content.memory} onChange={event => update('memory', event.target.value)} />
                <button className="text-button" data-testid="button-next-to-gallery" type="button" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => jumpTo('gallery')}>Look what we kept ↓</button>
              </div>
            </article>
          </section>

          <div className="section-divider" />
          <section className="scene" id="gallery">
            <div className="scene-header">
              <span className="eyebrow">Little pieces of forever</span>
              <h2 className="section-title">Our kind of<br /><em style={{ color: 'var(--rose)' }}>magic.</em></h2>
              <p className="scene-intro">Add your favorite photos. They stay on this device, in this browser, just for this little story.</p>
            </div>
            <div className="gallery">
              {content.photos.map((photo, index) => (
                <article className="photo-card" key={`photo-${index}`}>
                  <div className="photo-frame">
                    {photo.image
                      ? <img src={photo.image} alt={photo.caption || `Personal memory ${index + 1}`} data-testid={`img-memory-${index + 1}`} />
                      : <div className="photo-placeholder" data-testid={`placeholder-memory-${index + 1}`}><span>0{index + 1}</span>A place for<br />your memory</div>}
                  </div>
                  <span className="photo-label">Memory · 0{index + 1}</span>
                  <textarea className="photo-caption" data-testid={`input-caption-${index + 1}`} aria-label={`Caption for photo ${index + 1}`} value={photo.caption} onChange={event => updatePhoto(index, 'caption', event.target.value)} />
                  <label className="upload-label">Choose a photo<input type="file" data-testid={`input-photo-${index + 1}`} accept="image/*" aria-label={`Choose photo ${index + 1}`} onChange={event => handlePhoto(index, event)} /></label>
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
            {confetti && <div className="confetti" aria-hidden="true">{Array.from({ length: 42 }, (_, index) => <i key={index} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 14) * -.12}s`, animationDuration: `${2.1 + (index % 7) * .18}s`, background: ['#e9bd79', '#ee9db6', '#c8b4e2', '#f5d9bd'][index % 4] }} />)}</div>}
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

      {settingsOpen && <div className="settings-panel" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <section className="settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
          <div className="settings-head"><h2 id="settings-heading">Make it yours</h2><button className="icon-button" data-testid="button-close-personalization" type="button" aria-label="Close personalization" onClick={() => setSettingsOpen(false)}><Icon kind="close" /></button></div>
          <p className="scene-intro" style={{ textAlign: 'left', margin: '0 0 20px' }}>Your words and photos are saved in this browser. Nothing is uploaded.</p>
          <label className="field">Her name<input data-testid="input-recipient-name" value={content.name} onChange={event => update('name', event.target.value)} placeholder="Shubhanandhini" /></label>
          <label className="field">Birthday message<textarea data-testid="input-birthday-message" value={content.birthdayMessage} onChange={event => update('birthdayMessage', event.target.value)} /></label>
          <label className="field">Gift message<textarea data-testid="input-gift-message" value={content.gift} onChange={event => update('gift', event.target.value)} /></label>
          <label className="field">Final message<textarea data-testid="input-final-message" value={content.finale} onChange={event => update('finale', event.target.value)} /></label>
          <label className="field file-control">Optional personal audio file<input data-testid="input-personal-audio" type="file" accept="audio/*" onChange={handleAudio} /><small style={{ display: 'block', marginTop: 8, color: '#b6a6bc' }}>{audioName ? `Selected: ${audioName}` : 'Audio starts only after you tap the music button.'}</small></label>
          <button className="quiet-button" data-testid="button-toggle-audio" type="button" onClick={() => void toggleMusic()}>{musicOn ? 'Pause audio' : 'Play audio'}</button>
          <p className="toastline" role="status">{note}</p>
          <button className="cta" data-testid="button-close-personalization-done" type="button" style={{ width: '100%', marginTop: 20 }} onClick={() => setSettingsOpen(false)}>Back to the surprise</button>
        </section>
      </div>}
    </div>
  );
}

export default App;
