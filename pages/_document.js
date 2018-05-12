// _document is only rendered on the server side and not on the client side
// Event handlers like onClick can't be added to this file

// ./pages/_document.js
import Document, { Head, Main, NextScript } from 'next/document'
import { colors, initialStyleString } from '../styles'
import classNames from 'classnames'

const body = classNames({
  backgroundColor: colors.dark
})

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <html>
        <Head>
          <style>{initialStyleString}</style>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <body className={body}>
          <Main />
          <NextScript />
          <link href="/static/fonts/poppins/stylesheet.css" rel="stylesheet" />
        </body>
      </html>
    )
  }
}
