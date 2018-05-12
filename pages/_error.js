import React, { Component } from 'react'
import { styles } from '../styles'

export default class Error extends Component {
  static getInitialProps({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    return { statusCode }
  }

  render() {
    const { centered, button_group } = styles;
    return (
      <div style={centered}>
        <h1>{this.props.statusCode}</h1>
        <h1>
          {this.props.statusCode ? `Congrats, you found a broken thingy!` : 'An error occurred.'}
        </h1>
        <a href="/"><button>Get me outta heah.</button></a>
      </div>
    )
  }
}
