import React from 'react'
import { Provider } from 'mobx-react'
import { initStore } from '../store'
import * as mobilenet from '@tensorflow-models/mobilenet';


const wrap = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const canvas = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
}


export default class Counter extends React.Component {
  static getInitialProps ({ req }) {
    const isServer = !!req
    const store = initStore(isServer)
    return { lastUpdate: store.lastUpdate, isServer }
  }

  constructor (props) {
    super(props)
    this.store = initStore(props.isServer, props.lastUpdate)
  }

  videoPlaying = () => {
    console.log('video playing');
  }

  newFrame = (frame) => {
    const { newFrame, model, canvas } = this;
    const image = new Image();
    image.id = "pic"
    image.src = canvas.toDataURL();
    
  }

  setupCamera = () => {
    const { video, newFrame } = this;
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { width: 513, height: 513, facingMode: 'user' }
      })
      .then(stream => {
        console.log('got stream');
        video.srcObject = stream;
        video.addEventListener('playing', this.videoPlaying);
        requestAnimationFrame(newFrame)
      });
  }

  async componentDidMount() {
    const video = document.querySelector('#webcam');
    video.width = 513;
    video.height = 513;
    const canvas = document.querySelector('#canvas');
    this.video = video;
    this.canvas = canvas;
    const that = this;
    mobilenet.load().then(model => {
      that.model = model;
      that.setupCamera();
      console.log('model loaded');
    })
  }

  render () {
    return (
      <Provider store={this.store}>
      <div>
        <h1>MobileNet</h1>
        <div id="wrap" style={wrap}>
          <video id="webcam" autoPlay></video>
        </div>
        <canvas id="canvas" style={canvas}></canvas>
      </div>
      </Provider>
    )
  }
}
