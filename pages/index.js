import Player from '../components/Player';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Radio 4200</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet" />
      </Head>
      <div className="main-container">
        <Player />
      </div>
    </>
  );
}