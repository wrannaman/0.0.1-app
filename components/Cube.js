import React, { Component } from 'react'
import { styles, colors } from '../styles'

const grid_styles = {
  width: 80,
  height: 80,
  backgroundColor: 'white',
  minWidth: 10,
  minHeight: 10,
  margin: 5,
  // float: 'left',
}

export default class Cube extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hover: false
    }
  }

  render() {
    const { hover } = this.state;
    return (
      <div
        style={Object.assign({}, grid_styles, { backgroundColor: hover ? colors.pink : 'white'})}
        onClick={() => this.setState({ hover: !hover })}
      />
    )
  }
}
