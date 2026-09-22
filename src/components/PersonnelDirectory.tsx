import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Shield,
  Activity,
  HeartPulse,
  Clock,
  MessageSquareHeart,
  SlidersHorizontal,
} from 'lucide-react';
import { Personnel, RiskLevel, PostingType } from '../types';

interface PersonnelDirectoryProps {
  personnelList: Personnel[];
  onSelectPersonnel: (personnelId: string) => void;
}

export const PersonnelDirectory: React.FC<PersonnelDirectoryProps> = ({
  personnelList,
  onSelectPersonnel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosting, setSelectedPosting] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<string>('All');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<'score' | 'id' | 'consecutive'>('score');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredPersonnel = useMemo(() => {
    return personnelList.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.maskedName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPosting = selectedPosting === 'All' || p.posting === selectedPosting;
      const matchesRisk = selectedRisk === 'All' || p.unified.state === selectedRisk;
      const matchesReview =
        selectedReviewStatus === 'All' || p.reviewStatus === selectedReviewStatus;

      return matchesSearch && matchesPosting && matchesRisk && matchesReview;
    }).sort((a, b) => {
      let valA: number | string = a.unified.score;
      let valB: number | string = b.unified.score;

      if (sortField === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortField === 'consecutive') {
        valA = a.operational.consecutiveDutyDays;
        valB = b.operational.consecutiveDutyDays;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [personnelList, searchTerm, selectedPosting, selectedRisk, selectedReviewStatus, sortField, sortAsc]);

  const handleSort = (field: 'score' | 'id' | 'consecutive') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div id="personnel-directory" className="space-y-4 pb-12">
      {/* Directory Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 font-mono">
            PERSONNEL WELFARE DIRECTORY
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Searchable roster with multi-pillar risk indices and data minimization safeguards.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID (e.g. PX-1042) or Unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-mono font-bold mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>FILTERS:</span>
        </div>

        {/* Posting Filter */}
        <select
          value={selectedPosting}
          onChange={(e) => setSelectedPosting(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
        >
          <option value="All">All Postings</option>
          <option value="Border">Border</option>
          <option value="Field">Field</option>
          <option value="High Altitude">High Altitude</option>
          <option value="Peace">Peace</option>
        </select>

        {/* Risk Filter */}
        <select
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
        >
          <option value="All">All Risk States</option>
          <option value="Human Review">Human Review</option>
          <option value="High">High</option>
          <option value="Elevated">Elevated</option>
          <option value="Watch">Watch</option>
          <option value="Stable">Stable</option>
        </select>

        {/* Review Status Filter */}
        <select
          value={selectedReviewStatus}
          onChange={(e) => setSelectedReviewStatus(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
        >
          <option value="All">All Review States</option>
          <option value="Pending Review">Pending Review</option>
          <option value="Reviewed">Reviewed</option>
          <option value="In Progress">In Progress</option>
        </select>

        {/* Clear Filters Button */}
        {(selectedPosting !== 'All' || selectedRisk !== 'All' || selectedReviewStatus !== 'All' || searchTerm) && (
          <button
            onClick={() => {
              setSelectedPosting('All');
              setSelectedRisk('All');
              setSelectedReviewStatus('All');
              setSearchTerm('');
            }}
            className="text-xs text-teal-600 hover:text-teal-700 font-medium ml-auto"
          >
            Reset All Filters
          </button>
        )}
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-mono uppercase tracking-wider">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Personnel ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-4 py-3">Posting & Unit</th>
                <th className="px-3 py-3">Duty Status</th>
                <th className="px-3 py-3 text-center">Physiological</th>
                <th className="px-3 py-3 text-center">Operational</th>
                <th className="px-3 py-3 text-center">Welfare</th>
                <th
                  onClick={() => handleSort('score')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Overall State</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3">Trajectory</th>
                <th className="px-3 py-3">Last Review</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
              {filteredPersonnel.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No personnel match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredPersonnel.map((p) => {
                  const isHumanReview = p.unified.state === 'Human Review';
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isHumanReview ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {p.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold block text-slate-900">{p.posting}</span>
                        <span className="text-[11px] text-slate-500">{p.unit}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.dutyStatus}
                        </span>
                      </td>

                      {/* Physiological Badge */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            p.physiological.score > 70
                              ? 'bg-red-100 text-red-700'
                              : p.physiological.score > 40
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.physiological.state} ({p.physiological.score})
                        </span>
                      </td>

                      {/* Operational Badge */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            p.operational.score > 70
                              ? 'bg-orange-100 text-orange-800'
                              : p.operational.score > 40
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {p.operational.state} ({p.operational.score})
                        </span>
                      </td>

                      {/* Welfare Badge */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            p.welfare.score > 70
                              ? 'bg-red-100 text-red-700'
                              : p.welfare.score > 40
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.welfare.state} ({p.welfare.score})
                        </span>
                      </td>

                      {/* Overall State */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              p.unified.state === 'Human Review'
                                ? 'bg-red-600 text-white'
                                : p.unified.state === 'High'
                                ? 'bg-orange-600 text-white'
                                : p.unified.state === 'Elevated'
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {p.unified.state}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {p.unified.score}
                          </span>
                        </div>
                      </td>

                      {/* Trajectory */}
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-600">
                        {p.unified.trajectoryState}
                      </td>

                      {/* Last Review */}
                      <td className="px-3 py-3 text-slate-500 text-[11px]">
                        {p.lastReviewDate || 'Pending'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onSelectPersonnel(p.id)}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-2xs"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
