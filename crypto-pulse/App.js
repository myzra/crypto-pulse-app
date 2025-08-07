import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

console.log('=== Environment Variables Debug ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('Type of SUPABASE_URL:', typeof process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Is SUPABASE_URL undefined?', process.env.EXPO_PUBLIC_SUPABASE_URL === undefined);
console.log('Is SUPABASE_URL null?', process.env.EXPO_PUBLIC_SUPABASE_URL === null);
console.log('Is SUPABASE_URL empty string?', process.env.EXPO_PUBLIC_SUPABASE_URL === '');
console.log('All process.env keys:', Object.keys(process.env));
console.log('=====================================');

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)

export default function App() {
  return <AppNavigator />;
}