import React, { Component } from 'react'
import Link from 'next/link'
import { inject, observer } from 'mobx-react'
import { styles, colors } from '../styles'

const cardStyle = {
  minWidth: 300,
  minHeight: 300,
  background: '#630cfd',
  margin: 20,
}

const textStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
}

@inject('store') @observer
class Page extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render () {
    const { id, cb } = this.props;
    return (
      <div style={cardStyle} onClick={() => cb(id)}>
        <h1 style={textStyle}>id: {id} </h1>
      </div>
    )
  }
}

export default Page
