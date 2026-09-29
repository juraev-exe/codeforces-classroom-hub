import { codeforcesService } from './modules/codeforces/codeforces.service.js';

async function runTests() {
  console.log('🧪 Starting Codeforces API Integration Tests...');

  // 1. Test validate handle (tourist)
  console.log('1. Testing validateHandle("tourist")...');
  const user = await codeforcesService.validateHandle('tourist');
  if (!user || user.handle.toLowerCase() !== 'tourist') {
    throw new Error('Failed to validate real handle "tourist"');
  }
  console.log(`✅ tourist found! Rating: ${user.rating}, Rank: ${user.rank}`);

  // 2. Test invalid handle
  console.log('2. Testing validateHandle with invalid non-existent handle...');
  const fakeUser = await codeforcesService.validateHandle('non_existent_handle_cf_9999999');
  if (fakeUser !== null) {
    throw new Error('Invalid handle should return null');
  }
  console.log('✅ Invalid handle rejected properly.');

  // 3. Test upcoming contests
  console.log('3. Testing getContestList()...');
  const contests = await codeforcesService.getContestList();
  console.log(`✅ Received ${contests.length} contests from Codeforces.`);

  // 4. Test user submissions
  console.log('4. Testing getUserSubmissions("tourist", 1, 5)...');
  const subs = await codeforcesService.getUserSubmissions('tourist', 1, 5);
  console.log(`✅ Received ${subs.length} submissions for tourist.`);

  console.log('🎉 All integration tests passed successfully!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
