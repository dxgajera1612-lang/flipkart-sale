// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        {/* Favicon */}
        <link rel="icon" href="/t_500x300.jpg" />
        <link rel="shortcut icon" href="/t_500x300.jpg" />
        <link rel="apple-touch-icon" href="/t_500x300.jpg" />
        
        {/* Meta tags */}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
