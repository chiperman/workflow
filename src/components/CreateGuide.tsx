'use client';

import { AlertCircle } from 'lucide-react';

interface CreateGuideProps {
  service: 'supabase' | 'leancloud';
  show: boolean;
  onCopy: (text: string) => void;
}

// Supabase table creation SQL
const supabaseCreateTableSQL = `-- Create keep_alive table
CREATE TABLE IF NOT EXISTS keep_alive (
  id INTEGER PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- Insert initial record
INSERT INTO keep_alive (id, timestamp, manual_count, auto_count)
VALUES (1, NOW(), 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (without creating policies)
-- Service role automatically bypasses RLS
-- Anon key and regular users cannot access this table
ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;`;

// LeanCloud class creation REST API command
const leanCloudCreateClassCommand = `# Create keep_alive class using REST API
# Replace YOUR_APP_ID, YOUR_APP_KEY, and YOUR_SERVER_URL with your credentials

curl -X POST \\
  -H "X-LC-Id: YOUR_APP_ID" \\
  -H "X-LC-Key: YOUR_APP_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "auto_count": 0,
    "manual_count": 0
  }' \\
  https://YOUR_SERVER_URL/1.1/classes/keep_alive`;

/**
 * 表/类创建引导组件
 *
 * 为 Supabase 和 LeanCloud 提供不同的创建指导
 */
export function CreateGuide({ service, show, onCopy }: CreateGuideProps) {
  if (!show) return null;

  if (service === 'supabase') {
    return (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">Table Setup Required</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              The{' '}
              <code className="px-1 py-0.5 bg-amber-100 rounded text-amber-900">keep_alive</code>{' '}
              table does not exist. Copy the SQL below and execute it in your Supabase SQL Editor.
            </p>
          </div>
        </div>
        <button
          onClick={() => onCopy(supabaseCreateTableSQL)}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-medium rounded border border-amber-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy SQL Statement
        </button>
      </div>
    );
  }

  // LeanCloud
  return (
    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-start gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900 mb-1">Class Setup Options</p>
          <p className="text-xs text-blue-700 leading-relaxed mb-2">
            <strong>Option 1 (Recommended):</strong> Click &quot;Run Task&quot; below and LeanCloud
            will automatically create the class.
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Option 2:</strong> Manually create the class using the REST API command below.
          </p>
        </div>
      </div>
      <button
        onClick={() => onCopy(leanCloudCreateClassCommand)}
        className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-xs font-medium rounded border border-blue-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        Copy REST API Command
      </button>
    </div>
  );
}
