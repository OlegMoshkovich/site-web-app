// Test script for logo upload functionality
// Run with: npx tsx scripts/test-logo-functionality.ts

import { createClient } from '@supabase/supabase-js';
import type { Site } from '../types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogoFunctionality() {
  console.log('🧪 Testing logo upload functionality...\n');

  try {
    // Test 1: Check if sites table exists and has logo_url column
    console.log('1. Testing sites table structure...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, description, logo_url')
      .limit(1);

    if (sitesError) {
      console.error('❌ Sites table query failed:', sitesError.message);
      console.log('   Please run the database migration script first');
      return;
    }
    console.log('✅ Sites table with logo_url column exists');

    // Test 2: Check if site-assets storage bucket exists
    console.log('\n2. Testing site-assets storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Storage buckets query failed:', bucketsError.message);
      return;
    }

    const siteAssetsBucket = buckets?.find(bucket => bucket.name === 'site-assets');
    if (!siteAssetsBucket) {
      console.error('❌ site-assets bucket not found');
      console.log('   Please create the site-assets bucket in Supabase dashboard');
      return;
    }
    console.log('✅ site-assets storage bucket exists');

    // Test 3: Check if site_plans table exists
    console.log('\n3. Testing site_plans table structure...');
    const { data: plans, error: plansError } = await supabase
      .from('site_plans')
      .select('id, site_id, plan_name, plan_url')
      .limit(1);

    if (plansError) {
      console.error('❌ Site plans table query failed:', plansError.message);
      console.log('   Please run the database migration script first');
      return;
    }
    console.log('✅ Site plans table exists');

    console.log('\n🎉 All tests passed! Logo upload functionality should work correctly.');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Go to Settings page');
    console.log('3. Create a new site with a logo');
    console.log('4. Verify the logo appears in the existing sites list');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLogoFunctionality();