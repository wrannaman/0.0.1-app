import React, { Component } from 'react'
import { styles, colors } from '../styles'


const container = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
}

const item = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 10,
}

class Page extends Component {
  constructor(props) {
    super(props)
    this.state = {
      maxWidth: 300,
    }
  }
  render () {
    const { maxWidth } = this.state
    const elements = Object.keys(this.props.elements);

    if (elements && elements.length > 5 && maxWidth !== 200) this.setState({ maxWidth: 200 })
    return (
      <div style={container}>
        {elements.map((e) => {
          const data = this.props.elements[e].data;
          const name = this.props.elements[e].name;
          console.log('name is ', name);
          return (
            <div key={e} style={item}>
              <img src={data} style={{ maxWidth }}/>
              <p>{name}</p>
            </div>
          )
        })}
      </div>
    )
  }
}

export default Page
