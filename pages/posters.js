import React from 'react'
import { Provider } from 'mobx-react'
import { initStore } from '../store'
import io from 'socket.io-client';
import { socket_url } from '../config'

import Poster from '../components/Poster'

const s = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
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

  componentDidMount () {
    this.initialize()
  }

  initialize = () => {
    this.setupSocket()
  }

  setupSocket = () => {
    this.setState({ waiting: true })
    if (this.socket) this.socket.disconnect();
    this.socket = io(socket_url, { transports: ['websocket'] });
    this.socket.on('connect', () => {
      console.log('SOCKET CONNECTED');
      setTimeout(() => {
        console.log('joining room!');
        this.socket.emit('join', 'rtc/master')
      }, 2000)
    });
    this.socket.on('stats', (stats) => {
      this.setState({ stats });
    });
    this.socket.on('disconnect', () => {

    });

    this.socket.on('requestPeerConnection', (data) => {
      console.log('request peer connection ', data);
      this.createPeer(data);
    })

  }

  componentWillUnmount () {
    this.socket.disconnect();
    this.socket = null;
  }

  fire = (index) => {
    console.log('firinig ', index);
    this.socket.emit('posters', { index });
  }

  render () {
    const cards = [1, 2, 3, 4, 5, 6, 7, 8];//create an empty array with length 45

    return (
      <Provider store={this.store}>
        <div style={s}>
          {cards.map((c, i) => <Poster key={c} id={i} cb={this.fire}/>)}
        </div>
      </Provider>
    )
  }
}
