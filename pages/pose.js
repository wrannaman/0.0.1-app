// https://codepen.io/teropa/pen/QxLrMp
import React from 'react';
import { Provider } from 'mobx-react';
import _ from 'lodash';
import * as posenet from '@tensorflow-models/posenet';
import StartAudioContext from 'startaudiocontext';
import { initStore } from '../store';


let VIDEO_SIZE = 720;
const SHOW_VIDEO = false;

const radius = 5;
const color = '#ff00b7';
const minPoseConfidence = 0.3;
const minPartConfidence = 0.7;
const lineWidth = 2;

const wrap = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'black'
}

const canvas = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}

const pre = Object.assign({}, canvas, {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '20px',
  fontFamily: 'Helvetica, Arial, sans-serif',
})

let videoStyle = {
  width: `${VIDEO_SIZE}px`,
  height: `${VIDEO_SIZE}px`,
  border: '1px solid #666',
  boxShadow: '0px 0px 100px 0px rgba(150, 150, 150, 0.4)',
  transform: 'scaleX(-1)',
}

const SEQUENCE = [
  // 'leftWrist',
  // 'leftElbow',
  // 'leftShoulder',
  // 'rightShoulder',
  // 'rightElbow',
  // 'rightWrist'
  'leftWrist',
  'leftElbow',
  'leftShoulder',
  'rightShoulder',
  'rightElbow',
  'rightWrist',
  'rightEar',
  'leftEar',
  'leftEye',
  'rightEye',
];

let Tone = null;

export default class Counter extends React.Component {
  static getInitialProps ({ req }) {
    const isServer = !!req
    const store = initStore(isServer)
    return { lastUpdate: store.lastUpdate, isServer }
  }

  constructor (props) {
    super(props)
    this.store = initStore(props.isServer, props.lastUpdate)
    this.state = {
      disabled: true,
    }
  }

  isLineLineIntersection = (x1, y1, x2, y2, x3, y3, x4, y4) => {
    // calculate the distance to intersection point
    const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      return true;
    }
    return false;
  }

  isLineRectangleIntersection = (x1, y1, x2, y2, rx, ry, rw, rh) => {
    const { isLineLineIntersection } = this;
    // check if the line has hit any of the rectangle's sides
    // uses the Line/Line below
    let left = isLineLineIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh);
    let right = isLineLineIntersection(
      x1,
      y1,
      x2,
      y2,
      rx + rw,
      ry,
      rx + rw,
      ry + rh
    );
    let top = isLineLineIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry);
    let bottom = isLineLineIntersection(
      x1,
      y1,
      x2,
      y2,
      rx,
      ry + rh,
      rx + rw,
      ry + rh
    );

    // if ANY of the above are true, the line
    // has hit the rectangle
    if (left || right || top || bottom) {
      return true;
    }
    return false;
  }

  detectPose = (net, scaleFactor) => {
    const { isLineLineIntersection, detectPose, step, captureCtx, video, captureCanvas, loopDuration, gamut, isLineRectangleIntersection } = this;
    const that = this;
    let { notesOn } = this;

    captureCtx.drawImage(video, 0, 0);
    net.estimateSinglePose(captureCanvas, scaleFactor, true, 32).then(pose => {
      // const points = SEQUENCE.map(part => _.find(pose.keypoints, { part })).filter(
      //   _.identity
      // );
      const points = pose.keypoints;
      that.points = points;
      let steps = loopDuration / step;
      let noteWidth = video.videoWidth / steps;
      let noteHeight = video.videoHeight / gamut;

      that.notesOn = [];
      for (let i = 0; i < steps; i++) {
        let x = i * noteWidth;
        let notesOnForStep = _.times(gamut, () => false);
        for (let j = 0; j < gamut; j++) {
          let y = j * noteHeight;
          for (let k = 0; k < points.length - 1; k++) {
            let p0 = points[k];
            let p1 = points[k + 1];
            if (points[k].score < minPoseConfidence) continue;
            if (
              isLineRectangleIntersection(
                p0.position.x,
                p0.position.y,
                p1.position.x,
                p1.position.y,
                x,
                y,
                noteWidth,
                noteHeight
              )
            ) {
              notesOnForStep[j] = true;
              break;
            }
          }
        }
        that.notesOn.push(notesOnForStep);
      }
    });
    setTimeout(() => detectPose(net, scaleFactor), step / 4 * 1000);
  }

  getOffshootPoint = ( { position: { x: x1, y: y1 } }, { position: { x: x2, y: y2 } } ) => {
    if (x1 === x2 && y1 === y2) {
      return [x1, y1];
    } else if (x1 === x2) {
      let ySign = (y2 - y1) / Math.abs(y2 - y1);
      return [x1, ySign * 1000];
    } else if (y1 === y2) {
      let xSign = (x2 - x1) / Math.abs(x2 - x1);
      return [xSign * 1000, y1];
    } else {
      let xSign = (x2 - x1) / Math.abs(x2 - x1);
      let ySign = (y2 - y1) / Math.abs(y2 - y1);
      let slope = (y2 - y1) / (x2 - x1);
      let x = x1 - xSign * 1000 * Math.sqrt(1 / (1 + slope ** 2));
      let y = y1 - xSign * slope * 1000 * Math.sqrt(1 / (1 + slope ** 2));
      return [x, y];
    }
  }

  toTuple = ({y, x}) => {
    return [y, x];
  }

  /**
 * Draws a line on a canvas, i.e. a joint
 */
  drawSegment = ([ay, ax], [by, bx], color, scale, ctx) => {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  drawSkeleton = (keypoints, minConfidence, ctx, scale = 1) => {
    const { toTuple, drawSegment } = this;
    const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, minConfidence);
    adjacentKeyPoints.forEach((keypoints) => {
      drawSegment(toTuple(keypoints[0].position),
        toTuple(keypoints[1].position), color, scale, ctx);
    });
  }

  easeOutQuad = (x) => {
    return x * x;
  }

  drawPoint = (ctx, y, x, r, color) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  renderPose = () => {
    const { ctx, canvas, video, easeOutQuad, step, startTime, points, loopDuration, gamut, detectPose, notesPlayed, renderPose, drawPoint } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate((canvas.width - VIDEO_SIZE) / 2, (canvas.height - VIDEO_SIZE) / 2);
    // if (points) {
    //   ctx.strokeStyle = `rgba(3, 169, 244, 0.75)`;
    //   ctx.lineWidth = 10;
    //   ctx.lineCap = 'round';
    //   ctx.beginPath();
    //   for (let point of points) {
    //     ctx.lineTo(point.position.x, point.position.y);
    //   }
    //   ctx.stroke();
    // }
    //

    if (points) {
      points.forEach((p) => {
        if (p.score > minPoseConfidence) drawPoint(ctx, p.position.y, p.position.x, radius, color)
      })
      this.drawSkeleton(points, minPartConfidence, ctx);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

    if (startTime) {
      let steps = loopDuration / step;
      let noteWidth = video.videoWidth / steps;
      let noteHeight = video.videoHeight / gamut;

      let playedFor = Tone.now() - startTime - step;
      let loopsGone = Math.floor(playedFor / loopDuration);
      let fraction = (playedFor - loopsGone * loopDuration) / loopDuration;

      let currentNote = Math.floor(fraction * steps);

      ctx.fillRect(currentNote * noteWidth, 0, noteWidth, video.videoHeight);

      let radius = Math.min(noteWidth, noteHeight) * 1.3;
      for (let i = 0; i < gamut; i++) {
        let y = (i + 1 / 2) * noteHeight;
        for (let j = 0; j < steps; j++) {
          let playedAt = notesPlayed[j][i];
          if (playedAt <= Tone.now() && playedAt > Tone.now() - 1) {
            let alpha = (1 - (Tone.now() - playedAt)) * 1.5;
            ctx.fillStyle = `rgba(255, 0, 183, ${alpha})`;
            let x = (j + 1 / 2) * noteWidth;
            ctx.beginPath();
            ctx.arc(x, y, radius * easeOutQuad(1 - alpha), 0, Math.PI * 40);
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
    requestAnimationFrame(renderPose);
  }

  getRandomNotes = (n, len = 3) => {
    const toPlay = [];
    if (n.length === 0) return [];
    if (n.length === 1) return n;
    for (let i = 0; i < (len > n.length ? n.length : len); i++) {
      const idx = Math.floor(Math.random() * n.length);
      toPlay.push(n[idx]);
    }
    return toPlay;
  }

  scheduleNextPlay = () => {
    try {
      const { step, nextPlay, startTime, loopDuration, notesOn, scheduleNextPlay, rootNote, scale, humanize, sampler, getRandomNotes } = this;
      while (this.nextPlay - Tone.now() < step) {
        let steps = loopDuration / step;
        let playedFor = Tone.now() - startTime;
        let loopsGone = Math.floor(playedFor / loopDuration);
        let fraction =
          (playedFor - loopsGone * loopDuration) / loopDuration;
        let notesToPlay = [];
        let currentNote = Math.floor(fraction * steps);
        if (notesOn && notesOn[currentNote]) {
          let noteToPlay = rootNote;
          for (let i = notesOn[currentNote].length - 1; i >= 0; i--) {
            if (notesOn[currentNote][i]) {
              notesToPlay.push({ note: noteToPlay, idx: i });
            }
            noteToPlay += scale[i % scale.length];
          }
        }
        notesToPlay = _.uniq(getRandomNotes(notesToPlay))
        for (let i = 0; i < notesToPlay.length; i++) {
          let now = i % 2 === 0;
          let t = now ? this.nextPlay : this.nextPlay + step / 2;
          t += humanize * Math.random();
          let freq = Tone.Frequency(notesToPlay[i].note, 'midi');
          sampler.triggerAttack(freq, t);
          this.notesPlayed[currentNote][notesToPlay[i].idx] = t;
        }

        this.nextPlay += step;
      }
      setTimeout(scheduleNextPlay, 10);
    } catch (e) {
      console.error('scheduleNextPlay E ', e);
    }
  }

  clickHandler = () => {
    const { preContent, captureCanvas, video, netPromise, step,scheduleNextPlay, renderPose, startTime, detectPose } = this;
    let { canvas, nextPlay } = this;
    const that = this;
    preContent.remove();
    video.width = VIDEO_SIZE;
    video.height = VIDEO_SIZE;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { width: VIDEO_SIZE, height: VIDEO_SIZE, facingMode: 'user' }
      })
      .then(stream => {
        video.srcObject = stream;
        video.addEventListener('playing', () => {
          let scaleFactor = Math.min(
            1.0,
            Math.max(0.2, video.videoWidth / VIDEO_SIZE * 0.5)
          );

          captureCanvas.width = video.videoWidth;
          captureCanvas.height = video.videoHeight;
          captureCanvas.style.width = `${video.videoWidth}px`;
          captureCanvas.style.height = `${video.videoHeight}px`;
          netPromise.then(net => detectPose(net, scaleFactor));

          let synth = new Tone.Synth().toMaster();
          nextPlay = Tone.now() + step;
          that.startTime = nextPlay;
          that.nextPlay = nextPlay;

          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
          });
          scheduleNextPlay();
          renderPose();
        });
      })
      .catch(e => console.error(e));
  }

  componentWillMount() {
    // hide video if show video false
    if (!SHOW_VIDEO) videoStyle.opacity = 0;
  }

  async componentDidMount() {
    Tone = require('tone');
    const video = document.querySelector('#webcam');
    const canvas = document.querySelector('#canvas');
    const captureCanvas = document.createElement('canvas');
    const preContent = document.querySelector('#pre');
    const startButton = document.querySelector('#start');
    const ctx = canvas.getContext('2d');
    const captureCtx = captureCanvas.getContext('2d');

    const step = Tone.Time('4n').toSeconds();
    const measure = Tone.Time('1m').toSeconds();
    const loopDuration = measure * 2;
    const scale = [1, 2, 2, 2, 1, 2, 2];
    const rootNote = Tone.Frequency('E4').toMidi();
    const gamut = 10;
    const humanize = 0.025;

    this.video = video
    this.canvas = canvas;
    this.preContent = preContent;
    this.ctx = ctx;
    this.captureCtx = captureCtx;
    this.captureCanvas = captureCanvas;
    this.startButton = startButton;

    this.step = step;
    this.measure = measure;
    this.loopDuration = loopDuration;
    this.scale = scale;
    this.rootNote = rootNote;
    this.gamut = gamut;
    this.humanize = humanize;


    const delay = new Tone.PingPongDelay(step * 3 / 4, .5).toMaster();
    const folder = 'light';

    const sampler = new Tone.Sampler({
      E4: `/static/sounds/${folder}/1.mp3`,
      'F#4': `/static/sounds/${folder}/2.mp3`,
      'G#4': `/static/sounds/${folder}/3.mp3`,
      A4: `/static/sounds/${folder}/4.mp3`,
      B4: `/static/sounds/${folder}/5.mp3`,
      'C#4': `/static/sounds/${folder}/6.mp3`,
      'D4': `/static/sounds/${folder}/7.mp3`,
      'E5': `/static/sounds/${folder}/8.mp3`,
      // C2: '/static/sounds/key-004-d-minor/pure-bell-c2.mp3`,
      // 'D#2': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-ds2.mp3',
      // 'F#2': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-fs2.mp3',
      // A2: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-a2.mp3',
      // C3: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-c3.mp3',
      // 'D#3': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-ds3.mp3',
      // 'F#3': 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-fs3.mp3',
      // A3: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/969699/pure-bell-a3.mp3'
    })
      .connect(delay)
      .toMaster();

    // sampler.release.value = 2;


    const netPromise = posenet.load();
    this.netPromise = netPromise;
    let buffersPromise = new Promise(res => Tone.Buffer.on('load', res));

    let points,
      notesOn,
      startTime,
      notesPlayed = _.times(loopDuration / step, () => _.times(gamut, () => 0));

    this.startTime = startTime;
    this.notesPlayed = notesPlayed;
    this.notesOn = notesOn;
    this.points = points;
    this.sampler = sampler;

    startButton.addEventListener('click', this.clickHandler);

    Promise.all([netPromise, buffersPromise]).then(() => {
      startButton.textContent = 'Start';
      this.setState({ disabled: false })
    });

    StartAudioContext(Tone.context, startButton);

  }

  render () {
    const { disabled } = this.state
    return (
      <Provider store={this.store}>
      <div>
        <div id="wrap" style={wrap}>
          <video id="webcam" autoPlay style={videoStyle}></video>
        </div>
        <canvas id="canvas" style={canvas}></canvas>
        <div id="pre" style={pre}>
          {!disabled && (<p>Strike a pose!</p>)}
          <button id="start" disabled={disabled}>Loading&hellip;</button>
        </div>
      </div>
      </Provider>
    )
  }
}
