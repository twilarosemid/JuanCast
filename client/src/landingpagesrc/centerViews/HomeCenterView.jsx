import React from 'react';
import RankingsView from './RankingsView';
import PollsView from './PollsView';
import BannerCarousel from './BannerCarousel';
import YouTubeContent from './YouTubeContent';

const HomeCenterView = () => {
  return (
    <>
    <BannerCarousel/>
      <RankingsView/>
      <PollsView/>
      <YouTubeContent/>
    </>
  );
};

export default HomeCenterView;