const test = require('node:test');
const assert = require('node:assert/strict');
const { getPollDisplayTitle, sortRankings, normalizeImageUrl } = require('./contentUtils');

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

test('normalizeImageUrl points localhost uploads to the deployed server', () => {
  assert.equal(
    normalizeImageUrl('http://localhost:5000/uploads/photo.jpg'),
    'https://juancast.onrender.com/uploads/photo.jpg'
  );
});

test('normalizeImageUrl preserves external image URLs and data URLs', () => {
  assert.equal(normalizeImageUrl('https://images.example.com/photo.jpg'), 'https://images.example.com/photo.jpg');
  assert.equal(normalizeImageUrl('data:image/png;base64,abc123'), 'data:image/png;base64,abc123');
});

test('normalizeImageUrl resolves relative upload paths to the deployed server', () => {
  assert.equal(
    normalizeImageUrl('/uploads/photo.jpg'),
    'https://juancast.onrender.com/uploads/photo.jpg'
  );
});
