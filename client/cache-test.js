// Simulate Apollo cache behavior
const cache = new Map();

// Simulate caching a query with full fields
const fullQuery = `
  query GetDemonstrations {
    demonstrations {
      id
      name  
      status
      description
    }
  }
`;

const minimalQuery = `
  query GetDemonstrations {
    demonstrations {
      id
    }
  }
`;

// Different cache keys based on query structure
const fullQueryKey = JSON.stringify({ query: fullQuery, variables: {} });
const minimalQueryKey = JSON.stringify({ query: minimalQuery, variables: {} });

console.log('Cache keys are different:');
console.log('Full query key:', fullQueryKey.slice(0, 80) + '...');
console.log('Minimal query key:', minimalQueryKey.slice(0, 80) + '...');
console.log('Keys equal?', fullQueryKey === minimalQueryKey);

// Cache some data
cache.set(fullQueryKey, { 
  demonstrations: [
    { id: '1', name: 'Demo 1', status: 'Active', description: 'Original data' }
  ]
});

console.log('\n--- After caching full query ---');
console.log('Full query cache:', cache.get(fullQueryKey));
console.log('Minimal query cache:', cache.get(minimalQueryKey));

// "Refetch" with minimal query
cache.set(minimalQueryKey, {
  demonstrations: [
    { id: '1' } // Only ID, fresh from server
  ]
});

console.log('\n--- After "refetching" minimal query ---');
console.log('Full query cache (unchanged):', cache.get(fullQueryKey));
console.log('Minimal query cache (new):', cache.get(minimalQueryKey));
console.log('\nResult: Original cache entry remains stale!');
