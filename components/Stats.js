import React, { Component } from 'react'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'
import io from 'socket.io-client';
import { styles, colors } from '../styles'
import { socket_url } from '../config'

const MAX_TRACK_TIME = 30 * 1000; // 1 minute;
const WRAN_NAME = 'WRAN_NAME';

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
      console.log('stats connected', this.state.name);
    });
    this.socket.on('stats', (stats) => {
      this.setState({ stats });
    });
    this.socket.on('disconnect', () => {

    });
  }

  componentWillUnmount () {
    this.socket.disconnect();
    this.socket = null;
  }

  ctrlText = (assignments, key) => {
    if (assignments[key] === -1) return (
      <div style={{ display: 'flex', justifyContent: 'center'}}>
        <h2 style={{ color: colors.purple }}>{key}{`\u00a0\u00a0`}</h2>
        <h2>is waiting :(</h2>
      </div>
      )
    return (
      <div style={{ display: 'flex', justifyContent: 'center'}}>
        <h2 style={{ color: colors.purple }}>{key}{`\u00a0\u00a0`}</h2>
        <h2>is controlling{`\u00a0\u00a0`}</h2>
        <h2 style={{ color: colors.pink }}>{assignments[key].name}</h2>
        <h2>.</h2>
      </div>
    )
  }

  trackToName = (track, ass) => {
    for (let key in ass) {
      if (ass[key] && ass[key].id && Number(ass[key].id) === Number(track)) return key
    }
    return '___________'
  }

  render () {
    const { stats } = this.state;
    const { centered, button_group } = styles;

    const waiting = [];
    const all_assignments = Object.keys(stats.assignments);
    let assigned = [];
    all_assignments.forEach((a) => {
        if (stats && stats.assignments[a] === -1) waiting.push(a)
    })
    assigned = all_assignments.filter(a => stats.assignments[a] !== -1)

    // <div>
    //   <img src="/static/img/wran.png" style={{ width: '25%' }}/>
    //   <h2> {`Wrannaman`}</h2>
    // </div>

    return (
      <div style={centered}>
        <div style={{ width: '100%', backgroundColor: '#fff', height: 1, }} />
        <div>
          {stats && stats.tracks && (
            Object.keys(stats.tracks).map((a, i) => {
              if (i >= stats.num_tracks) return null;
              return (
                <div style={{ display: 'flex', justifyContent: 'center'}} key={JSON.stringify(a) + i}>
                  <h2 style={{ width: 200, textAlign: 'left' }}>{stats.tracks[a].name}{`\u00a0\u00a0`}</h2>
                  <h2 style={{ color: colors.pink, width: 200, textAlign: 'left'  }}>{this.trackToName(a, stats.assignments)}</h2>
                </div>
              )
            })
          )}
        </div>
        <div>
          {stats && stats.assignments && (
            assigned.map((a, i) => (
              <div key={JSON.stringify(a) + i}>
                {this.ctrlText(stats.assignments, a)}
              </div>
            ))
          )}
        </div>
        {waiting.length && (
          <div>
            <div style={{ width: '100%', backgroundColor: '#fff', height: 1, }} />
            <div>
              <h2> {`Waiting`}</h2>
              <h3>{waiting.join(' ')}</h3>
            </div>
          </div>
        )}
      </div>
    )
  }
}

export default Page
