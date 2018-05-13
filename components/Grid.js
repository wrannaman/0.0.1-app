import React, { Component } from 'react'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'
import io from 'socket.io-client';
import { styles, colors } from '../styles'
import { socket_url } from '../config'
import Cube from './Cube';

const MAX_TRACK_TIME = 30 * 1000; // 1 minute;
const WRAN_NAME = 'WRAN_NAME';
const GRID_SIZE = 24;

let intervals = [];

@inject('store') @observer
class Page extends Component {
  constructor(props) {
    super(props)
    this.state = {
      stats: {
        assignments: {}
      }
    }
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
      console.log('grid connected');
    });
    this.socket.on('disconnect', () => {
    });
  }

  componentWillUnmount () {
    this.socket.disconnect();
    this.socket = null;
  }

  render () {
    const { centered } = styles;

    const grid_container = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 360,
      height: 'auto',
      margin: '0 auto',
      // alignItems: 'center',
      justifyContent: 'center',
    }



    const arr = Array.from(Array(GRID_SIZE).keys());
    return (
      <div style={grid_container}>
        {arr.map(g => <Cube key={g} />)}
      </div>
    )
  }
}

export default Page
