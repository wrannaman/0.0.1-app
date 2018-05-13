import React, { Component } from 'react'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'
import io from 'socket.io-client';
import { styles, colors } from '../styles'
import Loader from '../components/Loader'
import { socket_url } from '../config'

const MAX_TRACK_TIME = 3 * 1000; // 1 minute;
const WRAN_NAME = 'WRAN_NAME';

let intervals = [];

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
    }
  }
  componentDidMount () {
    this.initialize()
  }

  initialize = () => {
    const name = localStorage.getItem(WRAN_NAME);
    if (!name) return this.setState({ waiting: false }); // load form
    this.setState({ name, name_has_been_saved: true })
    this.setupSocket()
    intervals.forEach((i) => clearInterval(i))
    intervals = [];

    const interval = setInterval(this.countDown,1000)
    intervals.push(interval)

  }

  countDown = () => {
    let { time_remaining } = this.state;
    if (time_remaining - 1 === 0) {
      time_remaining = (MAX_TRACK_TIME / 1000) + 2;
      this.setupSocket()
    }
    this.setState({ time_remaining: time_remaining - 1 })
  }

  setupSocket = () => {
    this.setState({ waiting: true })
    if (this.socket) this.socket.disconnect();
    this.socket = io(socket_url, { transports: ['websocket', 'polling'] });
    this.socket.on('connect', () => {
      const { name } = this.state;
      setTimeout(() => {
        this.socket.emit('name', { name })
      }, 1000)
    });
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
    localStorage.setItem('WRAN_NAME', this.state.name);
    this.setState({ name_has_been_saved: true })
    this.initialize()
  }

  render () {
    const { time_remaining, assignment, waiting, name, name_has_been_saved } = this.state;
    const { centered, button_group } = styles;
    if (waiting) return (<Loader />)

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
        <div style={{
          position: 'absolute',
          bottom: 10,
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
