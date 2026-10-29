'use client';

import React, { useState } from 'react';
import { ListTodo, RefreshCw, CheckCircle2, Clock, AlertCircle, Copy } from 'lucide-react';
import { Button } from '@mimic-manager/ui';

interface JobItem {
  id: string;
  type: string;
  target: string;
  status: 'active' | 'completed' | 'failed' | 'pending';
  progress: number;
  duration: string;
}

export default function JobsPage() {
  const [jobs] = useState<JobItem[]>([
    {
      id: 'job_84a1',
      type: 'Media Optimization (WebP + AVIF)',
      target: 'hero-spring-banner.jpg',
      status: 'completed',
      progress: 100,
      duration: '420ms'
    },
    {
      id: 'job_84a2',
      type: 'AI Vision Alt-Text Generation',
      target: 'ceramic-coffee-mug-blue.jpg',
      status: 'completed',
      progress: 100,
      duration: '1.2s'
    },
    {
      id: 'job_84a3',
      type: 'Scheduled Mobile Audit',
      target: 'https://store.local',
      status: 'active',
      progress: 68,
      duration: '4.8s'
    }
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1F2430]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#E9ECF3]">Background Job Queues</h1>
          <p className="text-xs text-[#A5AEC0] mt-0.5">
            BullMQ distributed task workers with SSE real-time streaming and automatic retry backoff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Queue State
          </Button>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-lg bg-[#10131A] border border-[#2A3040] overflow-hidden">
        <div className="p-4 border-b border-[#1F2430] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#E9ECF3]">Task Execution History</h3>
          <span className="text-xs font-mono text-[#2FBF8F]">Redis AOF Queue Online</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0C10] text-[#747E92] font-mono border-b border-[#1F2430]">
              <tr>
                <th className="p-3">Job ID</th>
                <th className="p-3">Task Type</th>
                <th className="p-3">Payload Target</th>
                <th className="p-3">Status</th>
                <th className="p-3">Duration</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2430] text-[#E9ECF3]">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="p-3 font-mono text-[#7C6CFF]">{job.id}</td>
                  <td className="p-3 font-medium">{job.type}</td>
                  <td className="p-3 font-mono text-[#A5AEC0]">{job.target}</td>
                  <td className="p-3">
                    {job.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#2FBF8F]/15 border border-[#2FBF8F]/30 text-[#2FBF8F]">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}
                    {job.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-[#7C6CFF]/15 border border-[#7C6CFF]/30 text-[#7C6CFF] animate-pulse">
                        <Clock className="w-3 h-3" />
                        Processing ({job.progress}%)
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[#747E92]">{job.duration}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Copied diagnostics for ${job.id}`)}
                      className="text-xs text-[#A5AEC0] hover:text-white inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Diagnostics</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
