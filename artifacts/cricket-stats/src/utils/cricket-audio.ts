const audios: Record<string, HTMLAudioElement> = {};

function getAudio(path: string): HTMLAudioElement {
  if (typeof window === "undefined") return null as any;
  if (!audios[path]) {
    audios[path] = new Audio(path);
  }
  return audios[path];
}

export function playCowMooSound(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    const audio = getAudio(`${import.meta.env.BASE_URL}sounds/cow-moo.mp3`);
    if (!audio) return resolve();
    audio.currentTime = 0;
    audio.play().then(resolve).catch((error) => {
      console.warn("Cow-corner audio could not play", error);
      resolve();
    });
  });
}

export function playDuckSound(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    const audio = getAudio(`${import.meta.env.BASE_URL}sounds/duck-quack.mp3`);
    if (!audio) return resolve();
    audio.currentTime = 0;
    audio.play().then(resolve).catch((error) => {
      console.warn("Duck audio could not play", error);
      resolve();
    });
  });
}