import webAudioBuilder from 'waveform-data/webaudio';

import { roundToNearest } from '../utils';

export const createHtmlAudioElement = url => {
  const elem = document.createElement('audio');
  elem.src = url;
  return elem;
};

export const convertMillisecondsToBeats = (ms, bpm) => {
  const bps = bpm / 60;

  let beats = (ms / 1000) * bps;

  // To avoid floating-point issues like 2.999999997, let's round to the
  // nearest 1/64th beat, since that's the highest level of precision we
  // will actually need.
  return roundToNearest(beats, 1 / 64);
};

export const convertBeatsToMilliseconds = (beats, bpm) => {
  const bps = bpm / 60;
  return (beats / bps) * 1000;
};

export const getWaveformDataForFile = file => {
  const fileBlobUrl = URL.createObjectURL(file);
  const audioContext = new AudioContext();

  return new Promise((resolve, reject) => {
    fetch(fileBlobUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        webAudioBuilder(audioContext, buffer, (err, waveform) => {
          if (err) {
            reject(err);
          }

          resolve(waveform);
        });
      });
  });
};

export const snapToNearestBeat = (cursorPosition, bpm, offset) => {
  // cursorPosition will be a fluid value in ms, like 65.29.
  // I need to snap to the nearest bar.
  // So if my BPM is 60, there is a bar every 4 seconds, so I'd round to
  // 64ms.
  // Note that BPMs can be any value, even fractions, so I can't rely on
  // a decimal rounding solution :/
  const cursorPositionInBeats = convertMillisecondsToBeats(
    cursorPosition - offset,
    bpm
  );

  return (
    convertBeatsToMilliseconds(Math.round(cursorPositionInBeats), bpm) + offset
  );
};

export const getFormattedTimestamp = cursorPosition => {
  const seconds = String(Math.floor((cursorPosition / 1000) % 60)).padStart(
    2,
    '0'
  );
  const minutes = String(
    Math.floor((cursorPosition / (1000 * 60)) % 60)
  ).padStart(2, '0');

  return `${minutes}:${seconds}`;
};

export const getFormattedBarsAndBeats = cursorPositionInBeats => {
  const barNum = Math.floor(cursorPositionInBeats / 4);
  const beatNum = Math.floor(cursorPositionInBeats % 4);
  const remainder = String(roundToNearest(cursorPositionInBeats % 1, 1 / 32))
    .replace('0.', '')
    .slice(0, 3)
    .padEnd(3, '0');

  return `${barNum}:${beatNum}.${remainder}`;
};
