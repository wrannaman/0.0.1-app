import React, { Component } from 'react'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'
import io from 'socket.io-client';
import { styles, colors } from '../styles'
import Loader from '../components/Loader'
import { socket_url, ice_servers } from '../config'
import Peer from 'simple-peer'
import uuidv4 from 'uuid/v4';

const MAX_TRACK_TIME = 20 * 1000; // 1 minute;
const WRAN_NAME = 'WRAN_NAME';
const WRAN_UUID = 'WRAN_UUID';

let intervals = [];

const videoContainerStyles = {
  position: 'absolute',
  bottom: 0,
  right: 0,
}
const videoStyles = {
  width: 200,
  height: 200,
}

@inject('store') @observer
class Page extends Component {
  constructor(props) {
    super(props)
    this.state = {
      time_remaining: MAX_TRACK_TIME / 1000,
      no_assignment: false,
      waiting: true,
      name: '',
      name_has_been_saved: false,
      audio: false,
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
      },
      peer: null,
      interval: null,
    }
  }
  componentDidMount () {
    this.canvas = document.createElement('canvas');
    this.initialize()
    const { audio, video } = this.state;
    navigator.mediaDevices
    .getUserMedia({ audio, video }).
    then(this.onMedia)
    .catch(this.mediaError);
    // console.time('signal')
    let uuid = localStorage.getItem(WRAN_UUID);
    const name = localStorage.getItem(WRAN_NAME);

    if (!uuid) uuid = uuidv4()
    // console.log('uuid ', uuid);
    // set every time
    localStorage.setItem(WRAN_UUID, uuid);
    this.setState({ uuid })

  }
  masterToPeer = (d) => {
    console.log('master to peer ', d);
  }
  signal = (data) => {
    const { uuid, name } = this.state;
    // console.timeEnd('signal')
    // console.log('signal!', data);
    const completeSignal = Object.assign({}, data, { uuid, name: name || '...' });
    // console.log('COMPLETESIGNAL', completeSignal)
    this.socket.emit('peerToMaster', completeSignal);
  }
  socketSignalIn = (message) => {
    // if (message.type !== 'answer') return;
    // try {
    //   this.peer.signal({ type: message.type, sdp: message.sdp });
    // } catch (e) {
    //   console.error('webrtcSignalIn eerr', e);
    //   // peerError(serverId, incident);
    // }
  }
  onConnect = () => {
    console.log('connected!!!');
    // console.info(`Peer connected to server ${this.serverId} with name ${this.name}`);
    // this.status = 'connected';
    // this.isSettingUp = false;
    // this.pingPong();
    // if (this.incident) {
    //   this.requestPeerIncident(this.incident);
    // }
  }
  onError = (err) => { // eslint-disable-line
    console.log('error');
    // console.error(`Webrtc error for ${this.serverId}`);
    // this.isSettingUp = false;
    // console.log('peer error', serverId);
    // peerError(serverId, incident)
  }
  onClose = () => {
    console.log('close');
    // console.log('peer closed => no action');
    // peerError(serverId, incident);
    // this.isSettingUp = false;
  }
  onData = (d) => {
    console.log('data!');
    /* ===== Peeer receiving ======*/
    /*
      For Captures:
        s = start
        e = end
      For Ping:
        p = ping

      For no captures:
        NO_CAPTURES
    */
    // if (d.toString === NO_CAPTURES) {
    //   return console.log('NO_CAPTURES')
    // }
    // if (d.toString() === 'p') {
    //   return this.lastPing = Date.now();
    // }
    // if (d.toString() === 's') return this.buf = '';
    // if (d.toString() === 'e') return this.finishBuf();
    // return this.buf += d.toString();
  }
  peerConnection = () => {
    const { stream, uuid } = this.state;
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      channelName: uuid,
      config: {
        iceServers: ice_servers
      },
    });
    console.log('setup webrtc')
    peer.on('signal', this.signal);
    peer.on('error', this.onError);
    peer.on('connect', this.onConnect);
    peer.on('close', this.onClose);
    peer.on('data', this.onData);
    this.setState({ peer });
  }
  onMedia = (stream) => {
    const videoTracks = stream.getVideoTracks();
    console.log('Using video device: ' + videoTracks[0].label);
    stream.oninactive = function() {
      console.log('Stream inactive');
    };
    this.setState({ stream });
    console.log('stream set');
    this.peerConnection();
  }
  mediaError = (error ) => {
    // console.log('media error', error);
  }
  initialize = () => {
    // const name = localStorage.getItem(WRAN_NAME);
    const name = this.state.name;
    const uuid = localStorage.getItem(WRAN_UUID);
    if (!name) return this.setState({ waiting: false }); // load form
    this.setState({ name, name_has_been_saved: true })
    this.setupSocket()
    intervals.forEach((i) => clearInterval(i))
    intervals = [];

    const interval = setInterval(this.countDown,1000)
    intervals.push(interval);
  }

  countDown = () => {
    let { time_remaining } = this.state;
    if (time_remaining - 1 === 0) {
      time_remaining = (MAX_TRACK_TIME / 1000) + 2;
      // this.setupSocket()
      this.setState({ waiting: true, playing: false })
      this.socket.emit('newAssignment')
      setTimeout(() => this.setState({ waiting: false }), 1000)
    }
    this.setState({ time_remaining: time_remaining - 1 })
  }

  setupSocket = () => {
    console.log('setup socket');
    this.setState({ waiting: true })
    if (this.socket) this.socket.disconnect();
    this.socket = io(socket_url, { transports: ['websocket', 'polling'] });
    this.socket.on('masterToPeer', this.masterToPeer);
    this.socket.on('connect', () => {
      // console.log('signalling');
      console.log('socket connected');
      // this.socket.emit('peerToMaster', Object.assign({}, {test: true}, { name }));
      setTimeout(() => {
        const { name, uuid } = this.state;
        this.socket.emit('name', { name })
        this.socket.emit('uuid', { uuid })
        this.socket.emit('join', `rtc/${uuid}`);
      }, 1000)
    });
    this.socket.on('masterResponse', (message) => {
      console.log('got master response ', message);
      const { type, sdp } = message
      const peer = this.state.peer;
      if (message.type !== 'answer') return;
      try {
        peer.signal({ type, sdp });
      } catch (e) {
        console.error('signal back ', e)
      }
    })
    this.socket.on('assignment', (assignment) => {
      this.setState({ assignment, waiting: false })
    });
    this.socket.on('disconnect', () => {
    });
    this.socket.on('error', () => {
      console.error('socket e ');
    });
  }

  componentWillUnmount () {
    this.props.store.stop()
  }

  fire = (clip) => () => {
    const { assignment } = this.state;
    clip = assignment.count === clip ? 'STOP' : clip
    this.socket.emit('fire', { track: assignment.id, clip })
  }

  onChange = (which) => (e) => {
    this.setState({ [which]: e.target.value })
  }

  saveName = (e) => {
    e.preventDefault();
    const uuid = uuidv4();
    const { name } = this.state;
    // localStorage.setItem(WRAN_NAME, name);
    this.setState({ name_has_been_saved: true })
    this.initialize()
  }

  getPhoto = () => {
    const canvas = this.canvas;
    const { name, uuid } = this.state;
    var context = canvas.getContext('2d');
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    context.drawImage(this.videoRef, 0, 0, width, height);
    const data = canvas.toDataURL('image/png');
    this.socket.emit('frame', { data, name, uuid, })
  }

  handleVideoRef = (r) => {
    // if (!this.state.frameInterval) {
    //   const frameInterval = setInterval(this.getPhoto, 250)
    //   this.setState({ frameInterval });
    // }
    if (r) {
      this.videoRef = r;
    }
    const { stream } = this.state;
    this.videoRef.srcObject = stream;
    this.videoRef.onloadedmetadata = (e) => {
      console.log('');
      this.setState({ canPlay: true })
      this.videoRef.play();
    };
  }
  playVideo = () => {
    console.log('play video');
    this.setState({ playing: true });
    this.videoRef.play();
  }
  render () {
    const { time_remaining, assignment, waiting, name, name_has_been_saved, playing, stream, canPlay } = this.state;
    const { centered, button_group } = styles;
    const video =  stream ? (
      <div style={videoContainerStyles}>
        {false && stream && !playing ? (<button style={{ position: 'absolute', top: 15 }} disabled={!canPlay} onClick={this.playVideo}> PlAy</button>) : (null)}
        <video style={videoStyles} ref={this.handleVideoRef} />
      </div>
    ) : (null);
    if (waiting) return (
      <div>
        <div style={{ display: 'none' }}>
          {video}
        </div>
        <Loader />
      </div>
    )

    if (!name_has_been_saved) return (
      <div style={centered}>
        <div>
          <h2> {`Wrannaman`}</h2>
          <p> {`Welcomes y0u.`}</p>
          <img src="/static/img/wran.png" style={{ width: '50%' }}/>
          <p> {`now if you'd be so kind ...`}</p>
        </div>
        <div>
          <form onSubmit={this.saveName}>
            <div style={{ position: 'relative' }}>
              <input name="contact-name" type="text" onChange={this.onChange('name')}/>
              {!name && (<label>Yo NaMe plz...</label>)}
            </div>
            <div>
              <button onClick={this.saveName}>
                Gimme Sounds!
              </button>
            </div>
          </form>
        </div>
      </div>
    )
    return (
      <div style={centered}>
      {video}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 10,
          border: `1px solid ${colors.purple}`,
          width: 50,
          height: 50,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: colors.purple, }}>{time_remaining}</p>
        </div>
        <div style={{ marginTop: 15 }}>
          {assignment && !waiting && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
                <h2 style={{ textAlign: 'center' }}>{`You\'re controlling`}{`\u00a0\u00a0`}</h2>
                <h2 style={{ color: colors.pink, }}>{assignment.name}</h2>
              </div>
              <div style={button_group}>
                {Array.from(Array(assignment.count + 1).keys()).map((i) => (
                  <div key={i}>
                    <button onClick={this.fire(i)}>
                      { i === assignment.count ? `Stop` : assignment.names[i]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!assignment && !waiting && (
            <h1> {'You\'re sitting this one out... Sorry!'} </h1>
          )}
        </div>
      </div>
    )
  }
}

export default Page
