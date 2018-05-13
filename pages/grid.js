import React from 'react'
import { Provider } from 'mobx-react'
import { initStore } from '../store'
import Grid from '../components/Grid'

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

  render () {
    return (
      <Provider store={this.store}>
        <Grid title='Grid'  />
      </Provider>
    )
  }
}
