const test = require('node:test');
const assert = require('node:assert/strict');
const { getPollDisplayTitle, sortRankings } = require('./contentUtils');

test('getPollDisplayTitle appends Ended for past events', () => {
  const title = getPollDisplayTitle('K-pop Concert', new Date('2024-01-10T00:00:00Z'));
  assert.equal(title, 'K-pop Concert (Ended)');
});

test('getPollDisplayTitle does not append Ended for upcoming events', () => {
  const title = getPollDisplayTitle('K-pop Concert', new Date('2030-01-10T00:00:00Z'));
  assert.equal(title, 'K-pop Concert');
});

test('sortRankings orders by rank position and vote count', () => {
  const rankings = [
    { position: 3, voteCount: 3500 },
    { position: 1, voteCount: 9000 },
    { position: 2, voteCount: 7000 }
  ];

  assert.deepEqual(sortRankings(rankings).map((item) => item.position), [1, 2, 3]);
  assert.equal(sortRankings(rankings)[1].voteCount, 7000);
});
